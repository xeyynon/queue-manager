"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { IconClock, IconPlus } from "@/components/Icons";
import { TextField } from "@/components/TextField";
import { useNow } from "@/hooks/useNow";
import { usePolling } from "@/hooks/usePolling";
import { api, ApiFailure } from "@/lib/api";
import { formatDuration, LONG_WAIT_SECONDS } from "@/lib/format";
import type { QueueSummaryDTO } from "@/lib/types";
import { QUEUE_NAME_MAX } from "@/lib/validation";

export function QueueList({ initial, serverNow }: { initial: QueueSummaryDTO[]; serverNow: string }) {
  const router = useRouter();
  const [queues, setQueues] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [offset] = useState(() => Date.parse(serverNow) - Date.now());
  const now = useNow(offset, Date.parse(serverNow));

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ queues: QueueSummaryDTO[] }>("/api/queues");
      setQueues(data.queues);
    } catch {
      /* keep showing the last good list; the next poll retries */
    }
  }, []);
  usePolling(refresh, 10_000);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = name.replace(/\s+/g, " ").trim();
    if (!trimmed) {
      setError("Give the queue a name.");
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { queue } = await api<{ queue: { id: string } }>("/api/queues", { method: "POST", body: { name: trimmed } });
      router.push(`/queues/${queue.id}`);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't create the queue.");
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section aria-labelledby="queues-h" className="min-w-0">
        <h1 id="queues-h" className="text-2xl font-semibold tracking-tight">
          Your queues
        </h1>

        {queues.length === 0 ? (
          <div className="mt-6 rounded-md bg-surface px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">No queues yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-2">
              A queue is one line of people, like &ldquo;General OPD&rdquo; or &ldquo;Billing counter&rdquo;. Create your first one to start issuing tokens.
            </p>
            <Button variant="primary" className="mt-5" onClick={() => inputRef.current?.focus()}>
              <IconPlus />
              Name your first queue
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md bg-surface">
            {queues.map((q) => {
              const longest = q.oldestWaitingSince ? (now - Date.parse(q.oldestWaitingSince)) / 1000 : null;
              const isLong = longest !== null && longest >= LONG_WAIT_SECONDS;
              return (
                <li key={q.id}>
                  <Link
                    href={`/queues/${q.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-4 py-4 hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_110px_220px_130px]"
                  >
                    <span className="min-w-0 truncate text-base font-semibold text-ink">{q.name}</span>
                    <span className="text-right sm:text-left">
                      <span className="num text-xl font-semibold">{q.waiting}</span>{" "}
                      <span className="text-sm text-ink-2">waiting</span>
                    </span>
                    <span className={`flex items-center gap-1.5 text-sm ${isLong ? "text-warn-ink" : "text-ink-2"}`}>
                      {longest !== null ? (
                        <>
                          <IconClock />
                          <span>
                            longest <span className="tnum">{formatDuration(longest)}</span>
                            {isLong ? " · long wait" : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-ink-3">no one waiting</span>
                      )}
                    </span>
                    <span className="text-right text-sm text-ink-2 sm:text-left">
                      {q.nowServingNumber !== null ? (
                        <>
                          serving <span className="num font-medium text-ink">#{q.nowServingNumber}</span>
                        </>
                      ) : (
                        <span className="text-ink-3">none served yet</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="new-h" className="lg:pt-12">
        <form onSubmit={create} className="rounded-md bg-surface p-4" noValidate>
          <h2 id="new-h" className="mb-3 text-base font-semibold">
            New queue
          </h2>
          <TextField
            ref={inputRef}
            label="Queue name"
            placeholder="e.g. General OPD"
            value={name}
            maxLength={QUEUE_NAME_MAX}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            error={error}
          />
          <Button type="submit" variant="primary" busy={busy} className="mt-3 w-full">
            {busy ? "Creating…" : "Create queue"}
          </Button>
        </form>
      </section>
    </div>
  );
}
