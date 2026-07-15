import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  Mail,
  Luggage,
  RotateCcw,
  Compass,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { formatDateRange, isExpired } from "@/lib/dates";
import { Ridge } from "@/components/shared/ridge";
import { ListingImage, type ListingKind } from "@/components/shared/listing-image";

export const metadata: Metadata = { title: "Booking result" };

export default async function CheckoutResultPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      package: { select: { title: true, slug: true, coverImageUrl: true, startCity: true, destinations: true } },
      hotel: { select: { name: true, slug: true, coverImageUrl: true, city: true, state: true } },
      vehicle: { select: { title: true, coverImageUrl: true, city: true, state: true } },
    },
  });
  if (!booking || booking.touristId !== session.user.id) notFound();

  let title = "Your booking";
  let subtitle = "";
  let image = "";
  let kind: ListingKind = "package";
  if (booking.package) {
    title = booking.package.title;
    subtitle = `${booking.package.startCity} → ${booking.package.destinations.join(" → ")}`;
    image = booking.package.coverImageUrl;
  } else if (booking.hotel) {
    title = booking.hotel.name;
    subtitle = `${booking.hotel.city}, ${booking.hotel.state}`;
    image = booking.hotel.coverImageUrl;
    kind = "hotel";
  } else if (booking.vehicle) {
    title = booking.vehicle.title;
    subtitle = `${booking.vehicle.city}, ${booking.vehicle.state}`;
    image = booking.vehicle.coverImageUrl;
    kind = "vehicle";
  }

  if (booking.status === "CONFIRMED") {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {/* Celebratory header — the ridge ties the moment back to the brand
              instead of leaving a bare success tick on white. */}
          <div className="relative bg-pangong-tint pt-8">
            <div className="relative z-10 flex flex-col items-center px-6 pb-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="size-8 text-success" />
              </span>
              <h1 className="mt-3 font-heading text-2xl font-bold text-ink">
                You&apos;re going to Ladakh
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {formatINR(booking.totalAmount)} paid · booking confirmed
              </p>
            </div>
            <Ridge className="h-12" front="var(--surface)" />
          </div>

          <div className="px-6 pb-6">
            {/* Booking code is the thing people screenshot — give it weight. */}
            <div className="-mt-3 rounded-control border border-dashed border-pangong/40 bg-paper px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Booking code
              </p>
              <p className="font-mono text-2xl font-bold tracking-wider text-ink">
                {booking.bookingCode}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-sand">
                <ListingImage src={image} alt={title} kind={kind} sizes="64px" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{title}</p>
                <p className="truncate text-xs text-ink-muted">{subtitle}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-border-soft pt-4 text-sm">
              <Row icon={CalendarDays} label="Dates">
                {formatDateRange(booking.startDate, booking.endDate)}
              </Row>
              <Row icon={Users} label="Guests">
                {booking.guestCount} guest{booking.guestCount === 1 ? "" : "s"}
              </Row>
              <Row icon={Mail} label="Confirmation sent to">
                {session.user.email ?? "your email"}
              </Row>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/trips"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
              >
                <Luggage className="size-4" /> View my trips
              </Link>
              <Link
                href="/packages"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-control border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
              >
                <Compass className="size-4" /> Keep exploring
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Carry a photo ID and your inner-line permit where the route needs one.
        </p>
      </div>
    );
  }

  const canRetry = booking.status === "PENDING" && !isExpired(booking.expiresAt);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="rounded-card border border-border bg-surface p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger-tint">
          <XCircle className="size-8 text-danger" />
        </span>
        <h1 className="mt-3 font-heading text-2xl font-bold text-ink">
          {canRetry ? "Payment didn't go through" : "This hold has expired"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {canRetry
            ? "You haven't been charged. Your dates are still held — finish payment before the hold runs out."
            : "The reservation window closed and your dates were released. They may still be available to book again."}
        </p>

        <div className="mt-5 flex gap-3 rounded-control bg-sand px-4 py-3 text-left">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-surface">
            <ListingImage src={image} alt={title} kind={kind} sizes="56px" />
          </div>
          <div className="min-w-0 self-center">
            <p className="truncate text-sm font-medium text-ink">{title}</p>
            <p className="truncate text-xs text-ink-muted">
              {formatDateRange(booking.startDate, booking.endDate)} ·{" "}
              {formatINR(booking.totalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {canRetry ? (
            <Link
              href={`/checkout/${booking.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
            >
              <RotateCcw className="size-4" /> Try payment again
            </Link>
          ) : (
            <Link
              href="/packages"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
            >
              <Compass className="size-4" /> Browse again
            </Link>
          )}
          <Link
            href="/trips"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <Luggage className="size-4" /> My trips
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-pangong" />
      <dt className="w-32 shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-right font-medium text-ink sm:text-left">
        {children}
      </dd>
    </div>
  );
}
