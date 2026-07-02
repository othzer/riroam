"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DateRangeBookingWidget } from "@/components/tourist/date-range-booking-widget";

export type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  totalUnits: number;
};

// Selected-room state shared between the rooms card (left column) and the
// booking card (right column) — the same pattern as package extras.
type Ctx = { rooms: RoomOption[]; selectedId: string; setSelectedId: (id: string) => void };
const RoomCtx = createContext<Ctx | null>(null);
function useRooms(): Ctx {
  const c = useContext(RoomCtx);
  if (!c) throw new Error("useRooms must be used within HotelRoomProvider");
  return c;
}

export function HotelRoomProvider({
  rooms,
  children,
}: {
  rooms: RoomOption[];
  children: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(rooms[0]?.id ?? "");
  return (
    <RoomCtx.Provider value={{ rooms, selectedId, setSelectedId }}>
      {children}
    </RoomCtx.Provider>
  );
}

/** Selectable room list (left column). */
export function RoomsCard() {
  const { rooms, selectedId, setSelectedId } = useRooms();
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="mb-2 font-heading text-[15px] font-bold text-ink">Rooms</h2>
      <div className="space-y-2">
        {rooms.map((r) => {
          const on = r.id === selectedId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-control border p-3 text-left transition-colors",
                on ? "border-pangong ring-1 ring-pangong" : "border-border hover:border-ink/20",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-[16px] shrink-0 items-center justify-center rounded-full border-[1.5px]",
                    on ? "border-pangong" : "border-[#C9C4B6]",
                  )}
                >
                  {on && <span className="size-2 rounded-full bg-pangong" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink">{r.name}</span>
                  {r.description && (
                    <span className="block truncate text-[11px] text-ink-muted">{r.description}</span>
                  )}
                  <span className="block text-[11px] text-ink-muted">Sleeps {r.capacity}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[13px] font-bold text-ink">
                  {formatINR(r.pricePerNight)}
                </span>
                <span className="block text-[11px] text-ink-muted">/ night</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Booking card for the selected room (right column). */
export function HotelBookingCard({
  hotelId,
  freeCancellationDays,
  vendorName,
  vendorSlug,
  touristName,
}: {
  hotelId: string;
  freeCancellationDays: number;
  vendorName: string;
  vendorSlug: string;
  touristName: string;
}) {
  const { rooms, selectedId } = useRooms();
  const room = rooms.find((r) => r.id === selectedId) ?? rooms[0];
  if (!room) return null;

  return (
    <DateRangeBookingWidget
      key={room.id}
      target={{ bookingType: "HOTEL", hotelId, roomId: room.id }}
      pricePerUnit={room.pricePerNight}
      unitLabel="night"
      unitNoun="Rooms"
      maxUnits={room.totalUnits}
      maxGuestsPerUnit={room.capacity}
      freeCancellationDays={freeCancellationDays}
      vendorName={vendorName}
      vendorSlug={vendorSlug}
      touristName={touristName}
    />
  );
}
