// Shared by ElevationProfile and the acclimatization callout — leading days
// (from day 1) that stay at/below the safe-ascent threshold.
const ACCLIMATIZE_THRESHOLD_M = 3600;

export function acclimatizeDayCount(
  days: { altitudeMeters: number }[],
): number {
  let n = 0;
  for (const d of days) {
    if (d.altitudeMeters <= ACCLIMATIZE_THRESHOLD_M) n += 1;
    else break;
  }
  return n;
}
