import { HeartPulse } from "lucide-react";
import { acclimatizeDayCount } from "@/lib/itinerary";

export function AcclimatizationCallout({
  days,
}: {
  days: { altitudeMeters: number }[];
}) {
  const n = acclimatizeDayCount(days);
  if (n < 1) return null;

  const dayRange = n === 1 ? "Day 1" : `Days 1–${n}`;

  return (
    <div className="flex items-start gap-3 rounded-card border border-border bg-sand-deep px-4 py-3.5">
      <HeartPulse className="mt-0.5 size-5 shrink-0 text-apricot-text" />
      <p className="text-sm text-ink">
        <span className="font-semibold">{dayRange} stay below 3,600 m</span> —
        this route follows safe-ascent guidelines.
      </p>
    </div>
  );
}
