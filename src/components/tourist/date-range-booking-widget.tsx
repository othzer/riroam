"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CircleCheck, Minus, Plus, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { createBooking } from "@/actions/bookings";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

type HotelTarget = { bookingType: "HOTEL"; hotelId: string; roomId: string };
type VehicleTarget = { bookingType: "VEHICLE"; vehicleId: string };

// Date-range booking card (hotels + vehicles). Styled to match the package
// booking card: compact bordered field boxes, live line items, apricot CTA,
// and the shared vendor mini-card.
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
  unitNoun: string; // "Rooms" | "Vehicles"
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

  // Clamp guests down when fewer units means less total capacity.
  function handleUnitCountChange(next: number) {
    setUnitCount(next);
    setGuestCount((g) => Math.min(g, maxGuestsPerUnit * next));
  }

  async function onReserve() {
    setError(null);
    if (!start || !end || units < 1) return setError("Pick valid dates");
    if (contactName.trim().length < 2) return setError("Enter your name");
    if (!contactPhone.trim()) return setError("Enter a phone number");

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
      if (!res.ok) return setError(res.error);
      router.push(`/checkout/${res.bookingId}`);
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-[20px] font-extrabold text-ink">
          {formatINR(pricePerUnit)}
        </span>
        <span className="text-[11px] text-ink-muted">/ {unitLabel}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <DateField label={startLabel} value={start} onChange={setStart} />
        <DateField label={endLabel} value={end} min={start || undefined} onChange={setEnd} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stepper label={unitNoun} value={unitCount} min={1} max={maxUnits} onChange={handleUnitCountChange} />
        <Stepper label="Guests" value={guestCount} min={1} max={maxGuestsPerUnit * unitCount} onChange={setGuestCount} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block rounded-control border border-border px-2.5 py-2">
          <span className="block text-[11px] font-medium text-ink-muted">Full name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full bg-transparent text-[12.5px] text-ink outline-none"
          />
        </label>
        <label className="block rounded-control border border-border px-2.5 py-2">
          <span className="block text-[11px] font-medium text-ink-muted">Phone</span>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+91 …"
            className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-muted"
          />
        </label>
      </div>

      {units > 0 && (
        <div className="mt-3 flex justify-between text-[11.5px] text-ink-soft">
          <span>
            {formatINR(pricePerUnit)} × {units} {unitLabel}
            {units === 1 ? "" : "s"}
            {unitCount > 1 ? ` × ${unitCount}` : ""}
          </span>
          <span className="font-mono">{formatINR(total)}</span>
        </div>
      )}

      <div className="mt-2.5 flex items-baseline justify-between border-t border-border-soft pt-2.5">
        <span className="text-[12.5px] font-semibold text-ink">Total</span>
        <span className="font-mono text-[15px] font-bold text-ink">{formatINR(total)}</span>
      </div>

      {error && (
        <p className="mt-2.5 rounded-control bg-danger-tint px-2.5 py-2 text-[11.5px] text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onReserve}
        disabled={pending}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Reserving…" : "Reserve now"}
      </button>

      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-success">
        <CircleCheck className="size-3" />
        {freeCancelUntil
          ? `Free cancellation until ${freeCancelUntil}`
          : `Free cancellation up to ${freeCancellationDays} days before`}
      </p>
      <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-ink-muted">
        <Clock className="size-3" /> Your spot is held for 20 minutes at checkout
      </p>

      <VendorMiniCard name={vendorName} slug={vendorSlug} />
    </div>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block rounded-control border border-border px-2.5 py-2">
      <span className="block text-[11px] font-medium text-ink-muted">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[12.5px] font-semibold text-ink outline-none"
      />
    </label>
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
    <div className="rounded-control border border-border px-2.5 py-1.5">
      <span className="block text-[11px] font-medium text-ink-muted">{label}</span>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="font-mono text-[12.5px] font-semibold text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
