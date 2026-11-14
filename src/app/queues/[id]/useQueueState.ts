"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePolling } from "@/hooks/usePolling";
import { api, ApiFailure } from "@/lib/api";
import type { QueueStateDTO } from "@/lib/types";

export type Mutation = {
  /** Applied immediately to what the manager sees. */
  optimistic?: (s: QueueStateDTO) => QueueStateDTO;
  /** The real request. */
  request: () => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
};

/**
 * Live queue state with optimistic updates.
 * - Mutations run one at a time, in click order (a promise chain), so two quick
 *   "move up" clicks reach the server in the order they were made.
 * - While any mutation is pending, poll results are ignored so the list doesn't
 *   flicker back; after the last one settles, the server's state wins.
 * - On a rejected request the screen rolls back to the last server state and
 *   shows the server's message.
 */
export function useQueueState(queueId: string, initial: QueueStateDTO) {
  const [state, setState] = useState(initial);
  const [lastSync, setLastSync] = useState(() => Date.now());
  const [offline, setOffline] = useState(false);
  const serverState = useRef(initial);
  const pending = useRef(0);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const fetchSeq = useRef(0);
  const [clockOffset, setClockOffset] = useState(() => Date.parse(initial.serverNow) - Date.now());

  const refresh = useCallback(
    async (force = false) => {
      const seq = ++fetchSeq.current;
      try {
        const fresh = await api<QueueStateDTO>(`/api/queues/${queueId}`);
        if (seq !== fetchSeq.current) return; // a newer fetch started
        if (pending.current > 0 && !force) return; // don't stomp on in-flight changes
        serverState.current = fresh;
        setState(fresh);
        setClockOffset(Date.parse(fresh.serverNow) - Date.now());
        setLastSync(Date.now());
        setOffline(false);
      } catch (err) {
        if (err instanceof ApiFailure && err.code === "NETWORK") setOffline(true);
        else if (err instanceof ApiFailure && err.status === 404) {
          toast.error("This queue was deleted.");
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/queues";
        }
      }
    },
    [queueId],
  );

  usePolling(() => void refresh(), 5000);

  // B-09: the screen shows a change before the server has it (optimistic). If the
  // manager reloads or closes the tab while a change is still being sent, the
  // browser asks first, so a serve shown on screen is never silently dropped.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (pending.current > 0) e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const mutate = useCallback(
    (m: Mutation): Promise<boolean> => {
      pending.current++;
      if (m.optimistic) setState((s) => m.optimistic!(s));
      const run = chain.current.then(async () => {
        try {
          const result = await m.request();
          m.onSuccess?.(result);
          return true;
        } catch (err) {
          setState(serverState.current);
          const msg = err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.";
          toast.error(msg);
          return false;
        } finally {
          pending.current--;
          if (pending.current === 0) await refresh(true);
        }
      });
      chain.current = run.then(() => undefined);
      return run;
    },
    [refresh],
  );

  return { state, mutate, refresh, lastSync, offline, clockOffset };
}
