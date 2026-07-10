"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Clock } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

type ExtraOption = { id: string; name: string; price: number };

export function PackageBookingWidget({
  pricePerPerson,
  maxGroupSize,
  freeCancellationDays,
  availableFrom,
  availableTo,
  extras,
  vendorName,
  vendorSlug,
}: {
  pricePerPerson: number;
  maxGroupSize: number;
  freeCancellationDays: number;
  availableFrom: string; // ISO date
  availableTo: string; // ISO date
  extras: ExtraOption[];
  vendorName: string;
  vendorSlug: string;
}) {
  const [travellers, setTravellers] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

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

      <button
        type="button"
        onClick={() =>
          toast.info("Booking opens in a later release — checkout isn't live yet")
        }
        className="mt-4 w-full rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98]"
      >
        Reserve now
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
