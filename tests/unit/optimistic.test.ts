import { describe, expect, it } from "vitest";
import { applyCancel, applyMove, applyRestore, applyServe } from "@/lib/optimistic";
import type { QueueStateDTO, TokenDTO } from "@/lib/types";

const tok = (n: number, position = n): TokenDTO => ({
  id: `t${n}`,
  number: n,
  label: null,
  status: "waiting",
  position,
  createdAt: "2026-11-14T09:00:00.000Z",
  servedAt: null,
  cancelledAt: null,
  lastMove: null,
  lastMovedAt: null,
});

const state = (waiting: TokenDTO[], nowServing: TokenDTO | null = null): QueueStateDTO => ({
  queue: { id: "q", name: "Q", createdAt: "2026-11-14T08:00:00.000Z" },
  waiting,
  nowServing,
  recentServed: [],
  recentServeTimes: [],
  events: [],
  serverNow: "2026-11-14T10:00:00.000Z",
});
const NOW = "2026-11-14T10:00:00.000Z";
const nums = (s: QueueStateDTO) => s.waiting.map((t) => t.number);

describe("applyMove", () => {
  it("swaps with the neighbour and swaps positions too", () => {
    const s = applyMove(state([tok(1), tok(2), tok(3)]), "t3", "up", NOW);
    expect(nums(s)).toEqual([1, 3, 2]);
    expect(s.waiting.map((t) => t.position)).toEqual([1, 2, 3]);
    expect(s.waiting[1].lastMove).toBe("up");
  });
  it("is a no-op at the edges and for unknown ids", () => {
    const s0 = state([tok(1), tok(2)]);
    expect(applyMove(s0, "t1", "up", NOW)).toBe(s0);
    expect(applyMove(s0, "t2", "down", NOW)).toBe(s0);
    expect(applyMove(s0, "nope", "up", NOW)).toBe(s0);
  });
});

describe("applyServe", () => {
  it("moves the top token to now-serving and keeps history", () => {
    const prev = { ...tok(9), status: "served" as const, servedAt: NOW };
    const s = applyServe(state([tok(1), tok(2)], prev), NOW);
    expect(nums(s)).toEqual([2]);
    expect(s.nowServing?.number).toBe(1);
    expect(s.nowServing?.status).toBe("served");
    expect(s.recentServed[0].number).toBe(9);
  });
  it("does nothing on an empty queue", () => {
    const s0 = state([]);
    expect(applyServe(s0, NOW)).toBe(s0);
  });
});

describe("applyCancel + applyRestore (undo)", () => {
  it("puts a cancelled token back in its original place", () => {
    const s0 = state([tok(1), tok(2), tok(3)]);
    const cancelled = applyCancel(s0, "t2");
    expect(nums(cancelled)).toEqual([1, 3]);
    const restored = applyRestore(cancelled, tok(2));
    expect(nums(restored)).toEqual([1, 2, 3]);
  });
  it("does not duplicate a token that is already back", () => {
    const s0 = state([tok(1), tok(2)]);
    expect(applyRestore(s0, tok(2))).toBe(s0);
  });
});
