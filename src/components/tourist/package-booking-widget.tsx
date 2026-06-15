"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Clock, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { createBooking } from "@/actions/bookings";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

type ExtraOption = { id: string; name: string; price: number };

export function PackageBookingWidget({
  packageId,
  pricePerPerson,
  maxGroupSize,
  freeCancellationDays,
  availableFrom,
  availableTo,
  extras,
  vendorName,
  vendorSlug,
  touristName,
}: {
  packageId: string;
  pricePerPerson: number;
  maxGroupSize: number;
  freeCancellationDays: number;
  availableFrom: string; // ISO date
  availableTo: string; // ISO date
  extras: ExtraOption[];
  vendorName: string;
  vendorSlug: string;
  touristName: string;
}) {
  const router = useRouter();
  const [travellers, setTravellers] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [contactName, setContactName] = useState(touristName);
  const [contactPhone, setContactPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extrasTotal = extras
    .filter((e) => selectedExtras.has(e.id))
    .reduce((sum, e) => sum + e.price, 0);
  const baseTotal = pricePerPerson * travellers;
  const total = baseTotal + extrasTotal;

  const freeCancelUntil = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(`${startDate}T00:00:00.000Z`);
    return formatDate(addDays(start, -freeCancellationDays));
  }, [startDate, freeCancellationDays]);

  function toggleExtra(id: string) {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onReserve() {
    setError(null);
    if (!startDate) {
      setError("Pick a start date");
      return;
    }
    if (!contactPhone.trim()) {
      setError("Enter a phone number");
      return;
    }

    setPending(true);
    try {
      const res = await createBooking({
        bookingType: "PACKAGE",
        packageId,
        startDate,
        guestCount: travellers,
        extraIds: Array.from(selectedExtras),
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
          {formatINR(pricePerPerson)}
        </span>
        <span className="text-sm text-ink-muted">/person</span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Start date
          </span>
          <input
            type="date"
            min={availableFrom}
            max={availableTo}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Travellers
          </span>
          <div className="flex items-center justify-between rounded-control border border-border px-3 py-1.5">
            <button
              type="button"
              onClick={() => setTravellers((n) => Math.max(1, n - 1))}
              className="flex size-6 items-center justify-center rounded-full text-ink-soft hover:bg-sand"
              aria-label="Fewer travellers"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="font-mono text-sm text-ink">{travellers}</span>
            <button
              type="button"
              onClick={() => setTravellers((n) => Math.min(maxGroupSize, n + 1))}
              className="flex size-6 items-center justify-center rounded-full text-ink-soft hover:bg-sand"
              aria-label="More travellers"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {extras.length > 0 && (
          <div className="space-y-1.5">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              Extras
            </span>
            {extras.map((e) => (
              <label
                key={e.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-control border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedExtras.has(e.id)}
                    onChange={() => toggleExtra(e.id)}
                    className="accent-pangong"
                  />
                  {e.name}
                </span>
                <span className="font-mono text-xs text-ink-soft">
                  {formatINR(e.price)}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              Full name
            </span>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              Phone
            </span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
            />
          </label>
        </div>
      </div>

      {/* line items */}
      <div className="mt-4 space-y-1 border-t border-border-soft pt-3 text-sm">
        <div className="flex justify-between text-ink-soft">
          <span>
            {formatINR(pricePerPerson)} × {travellers}
          </span>
          <span className="font-mono">{formatINR(baseTotal)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between text-ink-soft">
            <span>Extras</span>
            <span className="font-mono">{formatINR(extrasTotal)}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between border-t border-border-soft pt-3">
        <span className="font-medium text-ink">Total</span>
        <span className="font-mono text-lg font-bold text-ink">
          {formatINR(total)}
        </span>
      </div>

      {/* Availability/validation errors render inline here, never as toasts */}
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
