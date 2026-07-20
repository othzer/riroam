"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, Clock, CircleCheck, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { addDays, formatDate } from "@/lib/dates";
import { createBooking } from "@/actions/bookings";
import { VendorMiniCard } from "@/components/tourist/vendor-mini-card";

export type Extra = { id: string; name: string; description: string | null; price: number };

// Shared extras selection so the extras card (left column) and the booking card
// (right column) stay in sync. The provider wraps the whole detail grid; the
// server-rendered itinerary/about/reviews sit alongside the two client leaves.
type Ctx = {
  extras: Extra[];
  selected: Set<string>;
  toggle: (id: string) => void;
};
const ExtrasContext = createContext<Ctx | null>(null);
function useExtras(): Ctx {
  const ctx = useContext(ExtrasContext);
  if (!ctx) throw new Error("useExtras must be used within PackageExtrasProvider");
  return ctx;
}

export function PackageExtrasProvider({
  extras,
  children,
}: {
  extras: Extra[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <ExtrasContext.Provider value={{ extras, selected, toggle }}>
      {children}
    </ExtrasContext.Provider>
  );
}

/** Selectable extras card (left column). */
export function ExtrasCard() {
  const { extras, selected, toggle } = useExtras();
  if (extras.length === 0) return null;

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <h2 className="mb-1 font-heading text-[15px] font-bold text-ink">Add extras</h2>
      {extras.map((e, i) => {
        const on = selected.has(e.id);
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => toggle(e.id)}
            aria-pressed={on}
            className={`flex w-full items-center gap-2.5 py-2.5 text-left ${
              i < extras.length - 1 ? "border-b border-border-soft" : ""
            }`}
          >
            <span
              className={`flex size-[16px] shrink-0 items-center justify-center rounded-[4px] ${
                on ? "bg-apricot" : "border-[1.5px] border-[#C9C4B6]"
              }`}
            >
              {on && <Check className="size-3 text-ink" strokeWidth={3} />}
            </span>
            <span className="flex-1 text-[12.5px] text-ink">
              {e.name}
              {e.description && (
                <span className="text-[11px] text-ink-muted"> · {e.description}</span>
              )}
            </span>
            <span className={`shrink-0 font-mono text-[11.5px] ${on ? "text-ink" : "text-ink-muted"}`}>
              {formatINR(e.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Sticky booking card (right column). */
export function BookingCard({
  packageId,
  pricePerPerson,
  maxGroupSize,
  freeCancellationDays,
  availableFrom,
  availableTo,
  defaultStartDate,
  vendorName,
  vendorSlug,
  touristName,
}: {
  packageId: string;
  pricePerPerson: number;
  maxGroupSize: number;
  freeCancellationDays: number;
  availableFrom: string;
  availableTo: string;
  /** Server-resolved and pre-clamped to the availability window, so the first
      client render matches SSR and the value is always selectable. */
  defaultStartDate: string;
  vendorName: string;
  vendorSlug: string;
  touristName: string;
}) {
  const router = useRouter();
  const { extras, selected } = useExtras();
  const [travellers, setTravellers] = useState(2);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [contactName, setContactName] = useState(touristName);
  const [contactPhone, setContactPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExtras = extras.filter((e) => selected.has(e.id));
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const baseTotal = pricePerPerson * travellers;
  const total = baseTotal + extrasTotal;

  const freeCancelUntil = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(`${startDate}T00:00:00.000Z`);
    return formatDate(addDays(start, -freeCancellationDays));
  }, [startDate, freeCancellationDays]);

  async function onReserve() {
    setError(null);
    if (!startDate) return setError("Pick a start date");
    if (contactName.trim().length < 2) return setError("Enter your name");
    if (!contactPhone.trim()) return setError("Enter a phone number");

    setPending(true);
    try {
      const res = await createBooking({
        bookingType: "PACKAGE",
        packageId,
        startDate,
        guestCount: travellers,
        extraIds: Array.from(selected),
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
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-[20px] font-extrabold text-ink">
          {formatINR(pricePerPerson)}
        </span>
        <span className="text-[11px] text-ink-muted">/ person</span>
      </div>

      <label className="mt-3 block rounded-control border border-border px-2.5 py-2">
        <span className="block text-[11px] font-medium text-ink-muted">Dates</span>
        <input
          type="date"
          min={availableFrom}
          max={availableTo}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-transparent text-[12.5px] font-semibold text-ink outline-none"
        />
      </label>

      <div className="mt-2 flex items-center justify-between rounded-control border border-border px-2.5 py-1.5">
        <div>
          <span className="block text-[11px] font-medium text-ink-muted">Travellers</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">{travellers}</span>
        </div>
        <div className="flex items-center gap-1">
          <StepBtn label="Fewer travellers" onClick={() => setTravellers((n) => Math.max(1, n - 1))}>
            <Minus className="size-3.5" />
          </StepBtn>
          <StepBtn label="More travellers" onClick={() => setTravellers((n) => Math.min(maxGroupSize, n + 1))}>
            <Plus className="size-3.5" />
          </StepBtn>
        </div>
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

      <div className="mt-3 space-y-1.5 text-[11.5px] text-ink-soft">
        <div className="flex justify-between">
          <span>
            {formatINR(pricePerPerson)} × {travellers}
          </span>
          <span className="font-mono">{formatINR(baseTotal)}</span>
        </div>
        {selectedExtras.length > 0 && (
          <div className="flex justify-between gap-2">
            <span className="truncate">Extras · {selectedExtras.map((e) => e.name).join(", ")}</span>
            <span className="shrink-0 font-mono">{formatINR(extrasTotal)}</span>
          </div>
        )}
      </div>

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

function StepBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand"
    >
      {children}
    </button>
  );
}
