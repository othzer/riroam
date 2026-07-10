"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Minus, Plus, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { createBooking } from "@/actions/bookings";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

type HotelTarget = { bookingType: "HOTEL"; hotelId: string; roomId: string };
type VehicleTarget = { bookingType: "VEHICLE"; vehicleId: string };

export function DateRangeBookingWidget({
  target,
  pricePerUnit,
  unitLabel,
  unitNoun,
  maxUnits,
  maxGuestsPerUnit,
  freeCancellationDays,
  vendorName,
  vendorSlug,
  touristName,
  startLabel = "Check-in",
  endLabel = "Check-out",
}: {
  target: HotelTarget | VehicleTarget;
  pricePerUnit: number;
  unitLabel: "night" | "day";
  unitNoun: string; // "Room" | "Vehicle"
  maxUnits: number;
  maxGuestsPerUnit: number;
  freeCancellationDays: number;
  vendorName: string;
  vendorSlug: string;
  touristName: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [unitCount, setUnitCount] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [contactName, setContactName] = useState(touristName);
  const [contactPhone, setContactPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const units = useMemo(() => {
    if (!start || !end) return 0;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.round(ms / 86_400_000);
    return days > 0 ? days : 0;
  }, [start, end]);

  const total = pricePerUnit * units * unitCount;

  const freeCancelUntil = useMemo(() => {
    if (!start) return null;
    return formatDate(addDays(new Date(`${start}T00:00:00.000Z`), -freeCancellationDays));
  }, [start, freeCancellationDays]);

  async function onReserve() {
    setError(null);
    if (!start || !end || units < 1) {
      setError("Pick valid dates");
      return;
    }
    if (!contactPhone.trim()) {
      setError("Enter a phone number");
      return;
    }

    setPending(true);
    try {
      const res = await createBooking({
        ...(target.bookingType === "HOTEL"
          ? { bookingType: "HOTEL", hotelId: target.hotelId, roomId: target.roomId }
          : { bookingType: "VEHICLE", vehicleId: target.vehicleId }),
        startDate: start,
        endDate: end,
        guestCount,
        unitCount,
        contactName,
        contactPhone,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/checkout/${res.bookingId}`);
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-xl font-bold text-ink">
          {formatINR(pricePerUnit)}
        </span>
        <span className="text-sm text-ink-muted">/{unitLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{startLabel}</span>
          <input
            type="date"
            name="startDate"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{endLabel}</span>
          <input
            type="date"
            name="endDate"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stepper
          label={unitNoun}
          value={unitCount}
          min={1}
          max={maxUnits}
          onChange={setUnitCount}
        />
        <Stepper
          label="Guests"
          value={guestCount}
          min={1}
          max={maxGuestsPerUnit * unitCount}
          onChange={setGuestCount}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Full name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Phone</span>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
      </div>

      {units > 0 && (
        <div className="mt-4 space-y-1 border-t border-border-soft pt-3 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>
              {formatINR(pricePerUnit)} × {units} {unitLabel}
              {units === 1 ? "" : "s"}
              {unitCount > 1 ? ` × ${unitCount}` : ""}
            </span>
            <span className="font-mono">{formatINR(total)}</span>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-between border-t border-border-soft pt-3">
        <span className="font-medium text-ink">Total</span>
        <span className="font-mono text-lg font-bold text-ink">
          {formatINR(total)}
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-control bg-danger-tint px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onReserve}
        disabled={pending}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Reserving…" : "Reserve now"}
      </button>

      <p className="mt-2 text-xs text-success">
        {freeCancelUntil
          ? `Free cancellation until ${freeCancelUntil}`
          : `Free cancellation up to ${freeCancellationDays} days before start`}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
        <Clock className="size-3" /> Your spot is held for 20 minutes at checkout
      </p>

      <div className="mt-4 border-t border-border-soft pt-4">
        <VendorMiniCard name={vendorName} slug={vendorSlug} />
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex items-center justify-between rounded-control border border-border px-3 py-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-6 items-center justify-center rounded-full text-ink-soft hover:bg-sand"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="font-mono text-sm text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-6 items-center justify-center rounded-full text-ink-soft hover:bg-sand"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
