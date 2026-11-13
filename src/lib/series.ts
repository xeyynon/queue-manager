export type LengthEvent = { queueId: string; at: number; waitingAfter: number };

/**
 * Peak number of people waiting (summed over the given queues) in each bucket.
 *
 * Queue length is a step function: it only changes when an event happens, and
 * every event stores the waiting count right after it. A bucket's peak is the
 * largest total seen in it, counting the level carried in from before the bucket.
 * Buckets that start after `now` are left out: the future has no data.
 */
export function buildQueueLengthSeries(opts: {
  from: number;
  to: number;
  bucketMs: number;
  now: number;
  initial: Record<string, number>;
  events: LengthEvent[];
}): { t: number; peak: number }[] {
  const { from, to, bucketMs, now, initial } = opts;
  const events = [...opts.events].sort((a, b) => a.at - b.at);
  const level: Record<string, number> = { ...initial };
  let total = Object.values(level).reduce((s, v) => s + v, 0);

  const end = Math.min(to, now);
  const out: { t: number; peak: number }[] = [];
  let i = 0;
  // Apply events before the first bucket (should not happen, but stay safe).
  while (i < events.length && events[i].at < from) {
    total += events[i].waitingAfter - (level[events[i].queueId] ?? 0);
    level[events[i].queueId] = events[i].waitingAfter;
    i++;
  }
  for (let start = from; start <= end; start += bucketMs) {
    const stop = start + bucketMs;
    let peak = total;
    while (i < events.length && events[i].at < stop) {
      const e = events[i];
      total += e.waitingAfter - (level[e.queueId] ?? 0);
      level[e.queueId] = e.waitingAfter;
      if (total > peak) peak = total;
      i++;
    }
    out.push({ t: start, peak });
  }
  return out;
}
