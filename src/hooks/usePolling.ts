"use client";
import { useEffect, useRef } from "react";

/** Call `onTick` every `ms` while the tab is visible, and right away when it becomes visible again. */
export function usePolling(onTick: () => void, ms: number) {
  const cb = useRef(onTick);
  useEffect(() => {
    cb.current = onTick;
  });
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      stop();
      id = setInterval(() => cb.current(), ms);
    };
    const stop = () => id && clearInterval(id);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        cb.current();
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [ms]);
}
