/**
 * Estimated wait, from the recent service rate (Little's Law: W = L / λ).
 *
 * λ (serves per second) is measured over the most recent serves inside the last
 * two hours. With fewer than MIN_SERVES serves there is no honest rate, so the
 * estimate is null and the UI shows "—" instead of a made-up number (DEC-007).
 */
export const MIN_SERVES = 3;
export const RATE_WINDOW_MS = 2 * 60 * 60 * 1000;
const MAX_SAMPLES = 10;

/** Mean seconds between serves, or null when there isn't enough recent data. */
export function serviceIntervalSeconds(serveTimesIso: string[], nowMs: number): number | null {
  const times = serveTimesIso
    .map((s) => Date.parse(s))
    .filter((t) => Number.isFinite(t) && t <= nowMs && nowMs - t <= RATE_WINDOW_MS)
    .sort((a, b) => b - a)
    .slice(0, MAX_SAMPLES);
  if (times.length < MIN_SERVES) return null;
  const span = times[0] - times[times.length - 1];
  if (span <= 0) return null;
  return span / 1000 / (times.length - 1);
}

/**
 * Seconds until the token at `position` (1 = next) is likely called.
 * The person at the top waits for the rest of the current service interval;
 * each person ahead adds one more interval.
 */
export function estimateWaitSeconds(
  position: number,
  intervalSec: number | null,
  lastServeIso: string | null,
  nowMs: number,
): number | null {
  if (intervalSec === null || position < 1) return null;
  const sinceLast = lastServeIso ? Math.max(0, (nowMs - Date.parse(lastServeIso)) / 1000) : 0;
  const remainingCurrent = Math.max(0, intervalSec - sinceLast);
  return (position - 1) * intervalSec + remainingCurrent;
}
