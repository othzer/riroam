"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { computeRefund, type BookingStatusLite } from "@/lib/refund";
import { ListingImage, type ListingKind } from "@/components/shared/listing-image";
import { BookingStatusPill } from "@/components/shared/booking-status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { CancelBookingButton } from "@/components/tourist/cancel-booking-button";
import { WriteReviewButton } from "@/components/tourist/write-review-button";
import { cn } from "@/lib/utils";

export type Trip = {
  id: string;
  bookingCode: string;
  status: BookingStatusLite;
  startDate: string;
  endDate: string;
  totalAmount: number;
  isPaid: boolean;
  hasReview: boolean;
  canPay: boolean;
  freeCancellationDays: number;
  listingTitle: string;
  listingImage: string;
  listingHref: string;
  listingKind: ListingKind;
};

type TabKey = "upcoming" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; match: (s: BookingStatusLite) => boolean }[] = [
  { key: "upcoming", label: "Upcoming", match: (s) => s === "PENDING" || s === "CONFIRMED" },
  { key: "completed", label: "Completed", match: (s) => s === "COMPLETED" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "CANCELLED" },
];

export function TripsList({ trips }: { trips: Trip[] }) {
  const [tab, setTab] = useState<TabKey>("upcoming");
  const active = TABS.find((t) => t.key === tab)!;
  const visible = trips.filter((t) => active.match(t.status));

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        {TABS.map((t) => {
          const count = trips.filter((x) => t.match(x.status)).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative px-3 py-2.5 text-sm font-medium transition-colors",
                t.key === tab ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label} ({count})
              {t.key === tab && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-pangong" />
              )}
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No trips here"
          body="When you book a stay, tour, or ride it'll show up in this tab."
          ctaLabel="Explore circuits"
          ctaHref="/packages"
        />
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const cancellable = computeRefund({
    status: trip.status,
    isPaid: trip.isPaid,
    startDate: new Date(trip.startDate),
    freeCancellationDays: trip.freeCancellationDays,
    totalAmount: trip.totalAmount,
  }).canCancel;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-control bg-sand">
          <ListingImage src={trip.listingImage} alt="" kind={trip.listingKind} sizes="96px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={trip.listingHref} className="truncate font-medium text-ink hover:text-pangong">
              {trip.listingTitle}
            </Link>
            <BookingStatusPill status={trip.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-ink-muted">{trip.bookingCode}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {formatDateRange(new Date(trip.startDate), new Date(trip.endDate))} ·{" "}
            <span className="font-mono">{formatINR(trip.totalAmount)}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border-soft pt-3">
        {trip.canPay && (
          <Link
            href={`/checkout/${trip.id}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Complete payment
          </Link>
        )}
        {cancellable && (
          <CancelBookingButton
            bookingId={trip.id}
            status={trip.status}
            startDate={trip.startDate}
            isPaid={trip.isPaid}
            freeCancellationDays={trip.freeCancellationDays}
            totalAmount={trip.totalAmount}
          />
        )}
        {trip.status === "COMPLETED" &&
          (trip.hasReview ? (
            <span className="text-xs text-ink-muted">Reviewed</span>
          ) : (
            <WriteReviewButton bookingId={trip.id} />
          ))}
      </div>
    </div>
  );
}
