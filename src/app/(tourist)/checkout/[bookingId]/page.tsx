import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { GST_RATE, splitInclusiveTotal } from "@/lib/fees";
import { formatDateRange, isExpired } from "@/lib/dates";
import { ListingImage, type ListingKind } from "@/components/shared/listing-image";
import { CountdownChip } from "@/components/tourist/countdown-chip";
import { RazorpayButton } from "@/components/tourist/razorpay-button";

export const metadata: Metadata = { title: "Checkout" };

async function getListingContext(booking: {
  bookingType: "PACKAGE" | "HOTEL" | "VEHICLE";
  packageId: string | null;
  hotelId: string | null;
  roomId: string | null;
  vehicleId: string | null;
}) {
  if (booking.bookingType === "PACKAGE" && booking.packageId) {
    const p = await prisma.package.findUnique({
      where: { id: booking.packageId },
      select: {
        title: true,
        coverImageUrl: true,
        startCity: true,
        destinations: true,
        freeCancellationDays: true,
      },
    });
    if (!p) return null;
    return {
      title: p.title,
      image: p.coverImageUrl,
      kind: "package" as ListingKind,
      routeLine: `${p.startCity} → ${p.destinations.join(" → ")}`,
      freeCancellationDays: p.freeCancellationDays,
    };
  }
  if (booking.bookingType === "HOTEL" && booking.hotelId && booking.roomId) {
    const [hotel, room] = await Promise.all([
      prisma.hotel.findUnique({
        where: { id: booking.hotelId },
        select: { name: true, coverImageUrl: true, city: true, state: true, freeCancellationDays: true },
      }),
      prisma.room.findUnique({ where: { id: booking.roomId }, select: { name: true } }),
    ]);
    if (!hotel) return null;
    return {
      title: `${hotel.name}${room ? ` — ${room.name}` : ""}`,
      image: hotel.coverImageUrl,
      kind: "hotel" as ListingKind,
      routeLine: `${hotel.city}, ${hotel.state}`,
      freeCancellationDays: hotel.freeCancellationDays,
    };
  }
  if (booking.bookingType === "VEHICLE" && booking.vehicleId) {
    const v = await prisma.vehicleListing.findUnique({
      where: { id: booking.vehicleId },
      select: { title: true, coverImageUrl: true, city: true, state: true, freeCancellationDays: true },
    });
    if (!v) return null;
    return {
      title: v.title,
      image: v.coverImageUrl,
      kind: "vehicle" as ListingKind,
      routeLine: `${v.city}, ${v.state}`,
      freeCancellationDays: v.freeCancellationDays,
    };
  }
  return null;
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      bookingExtras: { select: { nameSnapshot: true, priceSnapshot: true } },
    },
  });
  if (!booking || booking.touristId !== session.user.id) notFound();
  if (booking.status === "CONFIRMED") redirect(`/checkout/${bookingId}/result`);

  const expired = booking.status === "CANCELLED" || isExpired(booking.expiresAt);

  const listing = await getListingContext(booking);
  if (!listing) notFound();

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const breakdown = splitInclusiveTotal(booking.totalAmount);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">Checkout</h1>

      {expired ? (
        <div className="rounded-card border border-danger/30 bg-danger-tint px-5 py-6 text-center">
          <p className="font-semibold text-ink">This hold has expired</p>
          <p className="mt-1 text-sm text-ink-soft">
            The 20-minute reservation window closed before payment completed.
            Head back to the listing to book again.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* order summary */}
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-sand">
                <ListingImage src={listing.image} alt={listing.title} kind={listing.kind} sizes="64px" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{listing.title}</p>
                <p className="truncate text-xs text-ink-muted">{listing.routeLine}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatDateRange(booking.startDate, booking.endDate)} · {booking.guestCount} guest
                  {booking.guestCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1 border-t border-border-soft pt-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Base</span>
                <span className="font-mono">{formatINR(booking.baseAmount)}</span>
              </div>
              {booking.bookingExtras.map((e, i) => (
                <div key={i} className="flex justify-between text-ink-soft">
                  <span>{e.nameSnapshot}</span>
                  <span className="font-mono">{formatINR(e.priceSnapshot)}</span>
                </div>
              ))}
            </div>

            {/* Disclosure, not a surcharge — these come out of the total above,
                so the traveller pays exactly what the listing quoted. */}
            <div className="mt-3 space-y-1 rounded-control bg-sand px-3 py-2.5 text-xs">
              <p className="font-medium text-ink-soft">Included in this price</p>
              <div className="flex justify-between text-ink-muted">
                <span>Pre-tax fare</span>
                <span className="font-mono">{formatINR(breakdown.base)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>GST ({Math.round(GST_RATE * 100)}%)</span>
                <span className="font-mono">{formatINR(breakdown.gst)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Convenience fee</span>
                <span className="font-mono">{formatINR(breakdown.convenienceFee)}</span>
              </div>
            </div>

            <div className="mt-2 flex justify-between border-t border-border-soft pt-3">
              <span className="font-medium text-ink">Total payable</span>
              <span className="font-mono text-lg font-bold text-ink">
                {formatINR(booking.totalAmount)}
              </span>
            </div>
            <p className="mt-1 text-right text-[11px] text-ink-muted">
              All taxes and fees included — nothing extra at the property.
            </p>
          </div>

          {/* contact */}
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Contact</h2>
            <p className="text-sm text-ink-soft">{booking.contactName}</p>
            <p className="text-sm text-ink-soft">{booking.contactPhone}</p>
            {session.user.email && (
              <p className="text-sm text-ink-soft">{session.user.email}</p>
            )}
            <p className="mt-2 text-xs text-ink-muted">
              Your confirmation and booking code go to this email.
            </p>
          </div>

          {/* cancellation policy */}
          <div className="rounded-card border border-border bg-sand-deep px-5 py-4 text-sm text-ink-soft">
            Free cancellation up to {listing.freeCancellationDays} day
            {listing.freeCancellationDays === 1 ? "" : "s"} before the start date; 50% refund
            within that window. No refund once the trip has started.
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Reservation hold</span>
            {booking.expiresAt && <CountdownChip expiresAt={booking.expiresAt.toISOString()} />}
          </div>

          {!keyId || !booking.payment ? (
            <p className="rounded-control bg-danger-tint px-3 py-2 text-sm text-danger">
              Payments aren&apos;t configured yet — set the Razorpay keys to complete checkout.
            </p>
          ) : (
            <RazorpayButton
              bookingId={booking.id}
              razorpayOrderId={booking.payment.razorpayOrderId}
              amount={booking.totalAmount}
              keyId={keyId}
              name={booking.contactName}
              email={session.user.email ?? ""}
              phone={booking.contactPhone}
              expiresAt={booking.expiresAt?.toISOString()}
            />
          )}
        </div>
      )}
    </div>
  );
}
