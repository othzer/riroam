"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

export function DateRangeBookingWidget({
  pricePerUnit,
  unitLabel,
  freeCancellationDays,
  vendorName,
  vendorSlug,
  startLabel = "Check-in",
  endLabel = "Check-out",
}: {
  pricePerUnit: number;
  unitLabel: "night" | "day";
  freeCancellationDays: number;
  vendorName: string;
  vendorSlug: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const units = useMemo(() => {
    if (!start || !end) return 0;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.round(ms / 86_400_000);
    return days > 0 ? days : 0;
  }, [start, end]);

  const total = pricePerUnit * units;

  const freeCancelUntil = useMemo(() => {
    if (!start) return null;
    return formatDate(addDays(new Date(`${start}T00:00:00.000Z`), -freeCancellationDays));
  }, [start, freeCancellationDays]);

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
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{endLabel}</span>
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-control border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pangong"
          />
        </label>
      </div>

      {units > 0 && (
        <div className="mt-4 space-y-1 border-t border-border-soft pt-3 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>
              {formatINR(pricePerUnit)} × {units} {unitLabel}{units === 1 ? "" : "s"}
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
