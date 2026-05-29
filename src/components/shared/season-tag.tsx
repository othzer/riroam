const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function SeasonTag({ from, to }: { from: Date; to: Date }) {
  const a = MONTHS[from.getUTCMonth()];
  const b = MONTHS[to.getUTCMonth()];
  return (
    <span className="inline-block rounded-chip bg-sand px-2 py-0.5 text-xs font-medium text-ink-soft">
      Season {a} – {b}
    </span>
  );
}
