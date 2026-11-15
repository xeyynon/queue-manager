/**
 * Double-click protection that doesn't swallow deliberate presses.
 * A press within `windowMs` of the previous accepted press is treated as the
 * same press (a double-click, a bounced key). Anything later is a new action,
 * even if the previous request is still in flight: it is queued, not dropped.
 */
export const REPEAT_WINDOW_MS = 600;

export function createPressGuard(windowMs = REPEAT_WINDOW_MS) {
  let last = -Infinity;
  return (now: number): boolean => {
    if (now - last < windowMs) return false;
    last = now;
    return true;
  };
}
