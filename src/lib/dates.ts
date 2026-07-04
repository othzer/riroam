const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** "12 – 17 Sep 2026" style, or "28 Aug – 3 Sep 2026" across months. */
export function formatDateRange(start: Date, end: Date): string {
  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const s = start.getUTCDate();
  const e = end.getUTCDate();
  const year = end.getUTCFullYear();
  if (sameMonth) {
    return `${s} – ${e} ${MONTH[end.getUTCMonth()]} ${year}`;
  }
  return `${s} ${MONTH[start.getUTCMonth()]} – ${e} ${MONTH[end.getUTCMonth()]} ${year}`;
}

export function formatDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function isExpired(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() - Date.now() <= 0;
}

/** `yyyy-mm-dd` — the value format an `<input type="date">` expects. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Prefilled booking window, resolved on the server. Booking widgets are client
 * components, so deriving these from `Date.now()` in a `useState` initializer
 * would make the server and client render different values and break
 * hydration — the caller passes them down instead.
 *
 * A week of lead time is the default: Ladakh trips need permits and an
 * acclimatisation buffer, so "tomorrow" is rarely a real option.
 */
export function defaultBookingWindow(
  leadDays = 7,
  nights = 3,
  now: Date = new Date(),
): { start: string; end: string } {
  const start = addDays(now, leadDays);
  return { start: toISODate(start), end: toISODate(addDays(start, nights)) };
}

/** Keeps a prefilled date inside a listing's availability window. */
export function clampISODate(value: string, min?: string, max?: string): string {
  if (min && value < min) return max && min > max ? max : min;
  if (max && value > max) return max;
  return value;
}
