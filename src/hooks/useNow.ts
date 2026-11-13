"use client";
import { useSyncExternalStore } from "react";

// One shared 1-second ticker for every live timer on the page.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

// Whole seconds, so the snapshot is stable between ticks (required by useSyncExternalStore).
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

/**
 * Current time in ms, ticking every second, shifted by `offsetMs` (server clock
 * minus this PC's clock) so live timers agree with server timestamps.
 * During server render and hydration it returns `serverNowMs`, so the HTML
 * matches on both sides; the live value takes over right after.
 */
export function useNow(offsetMs: number, serverNowMs: number): number {
  const t = useSyncExternalStore(subscribe, getSnapshot, () => serverNowMs - offsetMs);
  return t + offsetMs;
}
