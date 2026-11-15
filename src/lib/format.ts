/** "45 s", "12 min", "1 h 05 min". Negative or NaN input is treated as 0. */
export function formatDuration(totalSeconds: number): string {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h} h ${String(rem).padStart(2, "0")} min`;
}

/** Clock-style elapsed time for live timers: "0:42", "12:05", "1:02:09". */
export function formatClock(totalSeconds: number): string {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Rounded estimate for display: "< 1 min", "~6 min", "~1 h 10 min". */
export function formatEstimate(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return "< 1 min";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `~${mins} min`;
  return `~${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min`;
}

/** Whole counts with Indian digit grouping, fixed locale so server and browser agree: 6501 → "6,501", 150000 → "1,50,000". */
export function formatCount(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-IN") : "—";
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/** Long-wait threshold for the waiting list: label and colour, never colour alone. */
export const LONG_WAIT_SECONDS = 15 * 60;

/** Label for a server bucket "YYYY-MM-DDTHH:MM" (local wall time in the viewer zone). */
export function bucketLabel(bucket: string, unit: "hour" | "day"): string {
  const [date, hm] = bucket.split("T");
  if (unit === "hour") {
    const h = Number(hm.slice(0, 2));
    return `${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00`;
  }
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}
