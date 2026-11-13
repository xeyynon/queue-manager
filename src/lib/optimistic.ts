import type { QueueStateDTO, TokenDTO } from "./types";

/*
 * Optimistic versions of each server mutation. The screen applies these at
 * once (feels instant), sends the request, then replaces the result with the
 * server's state. If the server rejects, the screen rolls back to the last
 * server state. They mirror queue-service.ts; tests/unit/optimistic.test.ts
 * keeps them honest.
 */

export function applyMove(s: QueueStateDTO, tokenId: string, direction: "up" | "down", nowIso: string): QueueStateDTO {
  const i = s.waiting.findIndex((t) => t.id === tokenId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= s.waiting.length) return s;
  const waiting = [...s.waiting];
  const a = waiting[i];
  const b = waiting[j];
  waiting[j] = { ...a, position: b.position, lastMove: direction, lastMovedAt: nowIso };
  waiting[i] = { ...b, position: a.position };
  return { ...s, waiting };
}

export function applyServe(s: QueueStateDTO, nowIso: string): QueueStateDTO {
  const [top, ...rest] = s.waiting;
  if (!top) return s;
  const served: TokenDTO = { ...top, status: "served", servedAt: nowIso };
  return {
    ...s,
    waiting: rest,
    nowServing: served,
    recentServed: s.nowServing ? [s.nowServing, ...s.recentServed].slice(0, 5) : s.recentServed,
  };
}

export function applyCancel(s: QueueStateDTO, tokenId: string): QueueStateDTO {
  return { ...s, waiting: s.waiting.filter((t) => t.id !== tokenId) };
}

/** Put a cancelled token back in its old place (it kept its position). */
export function applyRestore(s: QueueStateDTO, token: TokenDTO): QueueStateDTO {
  if (s.waiting.some((t) => t.id === token.id)) return s;
  const restored: TokenDTO = { ...token, status: "waiting", cancelledAt: null };
  const waiting = [...s.waiting, restored].sort((a, b) => a.position - b.position);
  return { ...s, waiting };
}
