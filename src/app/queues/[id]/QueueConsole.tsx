"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { IconBack, IconPlus } from "@/components/Icons";
import { useNow } from "@/hooks/useNow";
import { api } from "@/lib/api";
import { serviceIntervalSeconds } from "@/lib/estimate";
import { applyCancel, applyMove, applyRestore, applyServe } from "@/lib/optimistic";
import type { QueueStateDTO, TokenDTO } from "@/lib/types";
import { TOKEN_LABEL_MAX } from "@/lib/validation";
import { ActivityLog } from "./ActivityLog";
import { NowServing } from "./NowServing";
import { QueueSettings } from "./QueueSettings";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { useQueueState } from "./useQueueState";
import { WaitingList } from "./WaitingList";

export function QueueConsole({ initial }: { initial: QueueStateDTO }) {
  const queueId = initial.queue.id;
  const { state, mutate, refresh, lastSync, offline, clockOffset } = useQueueState(queueId, initial);
  const now = useNow(clockOffset, Date.parse(initial.serverNow));
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [serving, setServing] = useState(false);
  const servingRef = useRef(false);
  const addingRef = useRef(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDialogElement>(null);
  const base = `/api/queues/${queueId}`;
  const nowIso = () => new Date(Date.now() + clockOffset).toISOString();

  const interval = useMemo(() => serviceIntervalSeconds(state.recentServeTimes, now), [state.recentServeTimes, now]);
  const top = state.waiting[0] ?? null;

  const addToken = useCallback(async () => {
    if (addingRef.current) return;
    addingRef.current = true;
    setAdding(true);
    const text = label;
    const ok = await mutate({
      request: () => api<{ token: TokenDTO }>(`${base}/tokens`, { method: "POST", body: { label: text } }),
      onSuccess: (r) => {
        const t = (r as { token: TokenDTO }).token;
        toast.success(`Token #${t.number} added${t.label ? ` for ${t.label}` : ""}`);
      },
    });
    if (ok) setLabel("");
    addingRef.current = false;
    setAdding(false);
  }, [base, label, mutate]);

  const serveNext = useCallback(async () => {
    // Busy guard: a double-click sends one request. The server also checks
    // expectedTokenId, so even two tabs can't serve two people at once.
    if (servingRef.current || !top) return;
    servingRef.current = true;
    setServing(true);
    const expected = top;
    await mutate({
      optimistic: (s) => applyServe(s, nowIso()),
      request: () => api(`${base}/serve`, { method: "POST", body: { expectedTokenId: expected.id } }),
      onSuccess: () => toast(`Now serving #${expected.number}${expected.label ? ` · ${expected.label}` : ""}`),
    });
    servingRef.current = false;
    setServing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, mutate, top, clockOffset]);

  const move = useCallback(
    (t: TokenDTO, direction: "up" | "down") =>
      void mutate({
        optimistic: (s) => applyMove(s, t.id, direction, nowIso()),
        request: () => api(`${base}/tokens/${t.id}/move`, { method: "POST", body: { direction } }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, mutate, clockOffset],
  );

  const cancel = useCallback(
    (t: TokenDTO) => {
      void mutate({
        optimistic: (s) => applyCancel(s, t.id),
        request: () => api(`${base}/tokens/${t.id}/cancel`, { method: "POST" }),
        onSuccess: () =>
          toast(`Token #${t.number} cancelled`, {
            duration: 8000,
            action: {
              label: "Undo",
              onClick: () =>
                void mutate({
                  optimistic: (s) => applyRestore(s, t),
                  request: () => api(`${base}/tokens/${t.id}/restore`, { method: "POST" }),
                  onSuccess: () => toast(`Token #${t.number} is back in line`),
                }),
            },
          }),
      });
    },
    [base, mutate],
  );

  // Keyboard: A add · S serve next · ? shortcuts. Ignored while typing, with
  // modifier keys, on key repeat, or when a dialog is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      const k = e.key.toLowerCase();
      if (k === "a") {
        e.preventDefault();
        void addToken();
      } else if (k === "s") {
        e.preventDefault();
        void serveNext();
      } else if (e.key === "?") {
        e.preventDefault();
        helpRef.current?.showModal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addToken, serveNext]);

  const syncedAgo = Math.max(0, Math.round((now - clockOffset - lastSync) / 1000));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-32 lg:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/queues" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <IconBack />
            All queues
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{state.queue.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-ink-3" role="status">
            {offline ? (
              <span className="text-warn-ink">Offline · showing data from {syncedAgo}s ago</span>
            ) : (
              <>
                <span className="num">{state.waiting.length}</span> waiting
              </>
            )}
          </p>
          <Button variant="ghost" size="sm" onClick={() => helpRef.current?.showModal()} aria-keyshortcuts="?">
            Shortcuts
          </Button>
          <QueueSettings queueId={queueId} name={state.queue.name} waiting={state.waiting.length} onRenamed={() => void refresh(true)} />
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="waiting-h" className="min-w-0">
          <form
            className="flex items-end gap-2 rounded-md bg-surface p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void addToken();
            }}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="token-label" className="text-sm font-medium text-ink-2">
                Name or note <span className="font-normal text-ink-3">(optional)</span>
              </label>
              <input
                id="token-label"
                ref={labelRef}
                value={label}
                maxLength={TOKEN_LABEL_MAX}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Ravi K, wheelchair"
                className="h-10 w-full min-w-0 rounded-md bg-surface-2 px-3 text-ink placeholder:text-ink-3 outline-none focus-visible:outline-2 focus-visible:outline-accent pointer-coarse:h-11"
              />
            </div>
            <Button type="submit" variant="secondary" busy={adding} aria-keyshortcuts="a" className="shrink-0">
              <IconPlus />
              {adding ? "Adding…" : "Add token"}
            </Button>
          </form>

          <h2 id="waiting-h" className="mt-6 mb-2 flex items-baseline justify-between text-base font-semibold">
            <span>Waiting</span>
            <span className="text-sm font-normal text-ink-3">
              {interval !== null ? (
                <>
                  serving about every <span className="num">{Math.max(1, Math.round(interval / 60))} min</span>
                </>
              ) : (
                "estimates appear after 3 serves in 2 h"
              )}
            </span>
          </h2>
          <WaitingList
            tokens={state.waiting}
            now={now}
            interval={interval}
            lastServeAt={state.recentServeTimes[0] ?? null}
            onMove={move}
            onCancel={cancel}
            onAddFirst={() => labelRef.current?.focus()}
          />
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-18 lg:self-start">
          <NowServing current={state.nowServing} recent={state.recentServed} next={top} serving={serving} onServe={serveNext} />
          <ActivityLog events={state.events} />
        </aside>
      </div>

      <ShortcutsDialog ref={helpRef} />
    </main>
  );
}
