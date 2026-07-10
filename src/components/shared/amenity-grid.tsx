import { amenityMeta } from "@/lib/amenities";

export function AmenityGrid({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {amenities.map((a) => {
        const { label, icon: Icon } = amenityMeta(a);
        return (
          <div
            key={a}
            className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-ink-soft"
          >
            <Icon className="size-4 shrink-0 text-pangong" />
            {label}
          </div>
        );
      })}
    </div>
  );
}
