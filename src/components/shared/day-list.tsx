export type DayListItem = {
  dayNumber: number;
  title: string;
  location: string;
  altitudeMeters: number;
};

// Compact day list under the elevation profile: mono day chip · title ·
// location note · mono altitude, hairline-divided rows.
export function DayList({ days }: { days: DayListItem[] }) {
  return (
    <div className="divide-y divide-border-soft">
      {days.map((d) => (
        <div key={d.dayNumber} className="flex items-start gap-3 py-3">
          <span className="mt-0.5 shrink-0 rounded-chip bg-sand px-2 py-0.5 font-mono text-xs font-medium text-ink-soft">
            D{d.dayNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{d.title}</p>
            <p className="text-xs text-ink-muted">{d.location}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-ink-soft">
            {d.altitudeMeters.toLocaleString("en-IN")} m
          </span>
        </div>
      ))}
    </div>
  );
}
