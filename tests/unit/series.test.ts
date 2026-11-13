import { describe, expect, it } from "vitest";
import { buildQueueLengthSeries } from "@/lib/series";

const M = 60_000;

describe("buildQueueLengthSeries", () => {
  it("carries the level from before the range into the first bucket", () => {
    const s = buildQueueLengthSeries({ from: 0, to: 30 * M, now: 30 * M, bucketMs: 15 * M, initial: { q: 4 }, events: [] });
    expect(s).toEqual([
      { t: 0, peak: 4 },
      { t: 15 * M, peak: 4 },
      { t: 30 * M, peak: 4 },
    ]);
  });

  it("takes the peak inside a bucket, then carries the closing level", () => {
    const s = buildQueueLengthSeries({
      from: 0,
      to: 30 * M,
      now: 30 * M,
      bucketMs: 15 * M,
      initial: {},
      events: [
        { queueId: "q", at: 1 * M, waitingAfter: 1 },
        { queueId: "q", at: 2 * M, waitingAfter: 3 },
        { queueId: "q", at: 3 * M, waitingAfter: 2 },
      ],
    });
    expect(s.map((p) => p.peak)).toEqual([3, 2, 2]);
  });

  it("sums several queues correctly", () => {
    const s = buildQueueLengthSeries({
      from: 0,
      to: 15 * M,
      now: 15 * M,
      bucketMs: 15 * M,
      initial: { a: 2, b: 1 },
      events: [
        { queueId: "a", at: 1 * M, waitingAfter: 3 }, // total 4
        { queueId: "b", at: 2 * M, waitingAfter: 0 }, // total 3
      ],
    });
    expect(s[0].peak).toBe(4);
    expect(s[1].peak).toBe(3);
  });

  it("never draws buckets after now", () => {
    const s = buildQueueLengthSeries({ from: 0, to: 24 * 60 * M, now: 20 * M, bucketMs: 15 * M, initial: {}, events: [] });
    expect(s.map((p) => p.t)).toEqual([0, 15 * M]);
  });

  it("sorts unsorted events", () => {
    const s = buildQueueLengthSeries({
      from: 0,
      to: 0,
      now: 0,
      bucketMs: 15 * M,
      initial: {},
      events: [
        { queueId: "q", at: 2 * M, waitingAfter: 0 },
        { queueId: "q", at: 1 * M, waitingAfter: 5 },
      ],
    });
    expect(s[0].peak).toBe(5);
  });
});
