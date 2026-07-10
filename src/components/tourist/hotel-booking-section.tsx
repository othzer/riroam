"use client";

import { useState } from "react";
import { formatINR } from "@/lib/money";
import { DateRangeBookingWidget } from "@/components/tourist/date-range-booking-widget";
import { cn } from "@/lib/utils";

export type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
};

export function HotelBookingSection({
  rooms,
  freeCancellationDays,
  vendorName,
  vendorSlug,
}: {
  rooms: RoomOption[];
  freeCancellationDays: number;
  vendorName: string;
  vendorSlug: string;
}) {
  const [selectedId, setSelectedId] = useState(rooms[0]?.id);
  const selected = rooms.find((r) => r.id === selectedId) ?? rooms[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-3">
        <h2 className="font-heading text-xl font-bold text-ink">Rooms</h2>
        {rooms.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedId(r.id)}
            className={cn(
              "flex w-full items-center justify-between gap-4 rounded-card border bg-surface p-4 text-left transition-colors",
              r.id === selected?.id
                ? "border-pangong ring-1 ring-pangong"
                : "border-border hover:border-ink/20",
            )}
          >
            <div className="min-w-0">
              <p className="font-medium text-ink">{r.name}</p>
              {r.description && (
                <p className="mt-0.5 truncate text-xs text-ink-muted">{r.description}</p>
              )}
              <p className="mt-1 text-xs text-ink-muted">Sleeps {r.capacity}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-bold text-ink">
                {formatINR(r.pricePerNight)}
              </p>
              <p className="text-xs text-ink-muted">/night</p>
            </div>
          </button>
        ))}
      </div>

      <div className="lg:sticky lg:top-24 lg:h-fit">
        {selected && (
          <DateRangeBookingWidget
            pricePerUnit={selected.pricePerNight}
            unitLabel="night"
            freeCancellationDays={freeCancellationDays}
            vendorName={vendorName}
            vendorSlug={vendorSlug}
          />
        )}
      </div>
    </div>
  );
}
