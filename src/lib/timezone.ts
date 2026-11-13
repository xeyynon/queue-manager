/**
 * Return `tz` if it is a real IANA time zone, else "UTC".
 * Uses the DateTimeFormat constructor rather than Intl.supportedValuesOf, because
 * browsers report legacy aliases (Chrome says "Asia/Calcutta") that the list omits.
 */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz || tz.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(tz)) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}
