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
