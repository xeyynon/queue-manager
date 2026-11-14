"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false during server render and hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * A clock time in the viewer's own time zone, 24-hour.
 *
 * The server can't know the viewer's zone (Vercel runs in UTC), so formatting a
 * time while server-rendering produced UTC text and a hydration mismatch
 * (B-08, React error 418). This renders a neutral placeholder on the server and the
 * real local time right after hydration. Use it for every clock time in a
 * server-rendered component (guarded by tests/unit/no-ssr-time-format.test.ts).
 */
export function LocalTime({ iso, seconds = false, className = "num" }: { iso: string; seconds?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const text = hydrated
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        ...(seconds ? { second: "2-digit" } : {}),
        hourCycle: "h23",
      })
    : seconds
      ? "--:--:--"
      : "--:--";
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
