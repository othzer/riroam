import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateRange, toISODate } from "@/lib/dates";
import { ListingImage, type ListingKind } from "@/components/shared/listing-image";

/** How far ahead a trip still counts as "coming up" on the landing page. */
const HORIZON_DAYS = 30;

function daysUntil(start: Date, now: Date): number {
  // Compare calendar days, not elapsed milliseconds — a trip starting tomorrow
  // morning should read "tomorrow", not "in 0 days" because it's 14 hours out.
  const a = Date.parse(`${toISODate(start)}T00:00:00.000Z`);
  const b = Date.parse(`${toISODate(now)}T00:00:00.000Z`);
  return Math.round((a - b) / 86_400_000);
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Happening now";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * Landing-page nudge for a signed-in traveller's next confirmed trip. Renders
 * nothing for signed-out visitors or anyone without one, so the hero is
 * unchanged for first-time users.
 */
export async function UpcomingTrip() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const horizon = new Date(now);
  horizon.setUTCDate(horizon.getUTCDate() + HORIZON_DAYS);

  const booking = await prisma.booking.findFirst({
    where: {
      touristId: session.user.id,
      status: "CONFIRMED",
      // Bound on endDate, not startDate: a trip that's already underway hasn't
      // stopped being the one worth surfacing. Gating on startDate >= now hid
      // it for the whole time the traveller was actually on it, and left the
      // "Happening now" label below unreachable.
      startDate: { lte: horizon },
      endDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    include: {
      package: { select: { title: true, slug: true, coverImageUrl: true } },
      hotel: { select: { name: true, slug: true, coverImageUrl: true } },
      vehicle: { select: { title: true, coverImageUrl: true } },
    },
  });
  if (!booking) return null;

  let title = "Your trip";
  let image = "";
  let kind: ListingKind = "package";
  if (booking.package) {
    title = booking.package.title;
    image = booking.package.coverImageUrl;
  } else if (booking.hotel) {
    title = booking.hotel.name;
    image = booking.hotel.coverImageUrl;
    kind = "hotel";
  } else if (booking.vehicle) {
    title = booking.vehicle.title;
    image = booking.vehicle.coverImageUrl;
    kind = "vehicle";
  }

  const days = daysUntil(booking.startDate, now);

  return (
    <section className="mx-auto max-w-6xl px-6 pt-6">
      <Link
        href="/trips"
        className="group flex items-center gap-4 rounded-card border border-pangong/25 bg-pangong-tint/40 p-3.5 transition-colors hover:border-pangong/50"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-sand">
          <ListingImage src={image} alt="" kind={kind} sizes="56px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-pangong-deep">
            <CalendarClock className="size-3.5" />
            {countdownLabel(days)}
          </p>
          <p className="mt-0.5 truncate font-heading text-[15px] font-bold text-ink">
            {title}
          </p>
          <p className="truncate text-[11.5px] text-ink-soft">
            {formatDateRange(booking.startDate, booking.endDate)} ·{" "}
            <span className="font-mono">{booking.bookingCode}</span>
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-pangong transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
