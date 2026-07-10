import { Users, Cog, Fuel } from "lucide-react";

export function VehicleSpecGrid({
  seats,
  transmission,
  fuelType,
}: {
  seats?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
}) {
  const specs = [
    seats != null && { icon: Users, label: `${seats} seats` },
    transmission && { icon: Cog, label: transmission },
    fuelType && { icon: Fuel, label: fuelType },
  ].filter(Boolean) as { icon: typeof Users; label: string }[];

  if (specs.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {specs.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1.5 rounded-control border border-border bg-surface py-3 text-center"
        >
          <s.icon className="size-4 text-pangong" />
          <span className="text-xs capitalize text-ink-soft">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
