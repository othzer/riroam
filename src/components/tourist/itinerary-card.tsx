import { Activity } from "lucide-react";
import { ElevationProfile } from "@/components/shared/elevation-profile";
import { acclimatizeDayCount } from "@/lib/itinerary";

type Day = {
  dayNumber: number;
  title: string;
  location: string;
  altitudeMeters: number;
};

// The signature itinerary card (design §4/§6, matching the mockup): one white
// card holding the day-by-day elevation profile, the compact day list, and the
// acclimatization callout — heading inside the box.
export function ItineraryCard({ days }: { days: Day[] }) {
  const acclimatizeDays = acclimatizeDayCount(days);
  const dayRange = acclimatizeDays === 1 ? "Day 1" : `Days 1–${acclimatizeDays}`;

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[15px] font-bold text-ink">
          Day-by-day elevation
        </h2>
        <span className="text-[11px] text-ink-muted">route profile · metres</span>
      </div>

      <div className="mt-1.5">
        <ElevationProfile
          days={days.map((d) => ({
            dayNumber: d.dayNumber,
            altitudeMeters: d.altitudeMeters,
            passName: /\bla\b/i.test(d.title)
              ? d.title.split(/—|to/).pop()?.trim()
              : undefined,
          }))}
        />
      </div>

      <div className="mt-2.5 border-t border-border-soft">
        {days.map((d) => (
          <div
            key={d.dayNumber}
            className="flex items-center gap-2.5 border-b border-border-soft py-2 last:border-b-0"
          >
            <span className="shrink-0 rounded-[5px] bg-sand px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
              D{d.dayNumber}
            </span>
            <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
              <span className="font-semibold">{d.title}</span>
              <span className="text-ink-muted"> · {d.location}</span>
            </p>
            <span className="shrink-0 font-mono text-[11px] text-ink-soft">
              {d.altitudeMeters.toLocaleString("en-IN")} m
            </span>
          </div>
        ))}
      </div>

      {acclimatizeDays >= 1 && (
        <div className="mt-2.5 flex items-center gap-2 rounded-control border border-[#E9DFC8] bg-sand-deep px-2.5 py-2 text-[11.5px] text-apricot-text">
          <Activity className="size-4 shrink-0" />
          <span>
            {dayRange} stay below 3,600 m — this route follows safe-ascent
            guidelines for altitude.
          </span>
        </div>
      )}
    </div>
  );
}
