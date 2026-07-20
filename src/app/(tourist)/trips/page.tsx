import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isExpired } from "@/lib/dates";
import type { ListingKind } from "@/components/shared/listing-image";
import { TripsList, type Trip } from "@/components/tourist/trips-list";

export const metadata: Metadata = { title: "My trips" };

export default async function TripsPage() {
  const session = await requireUser();

  const bookings = await prisma.booking.findMany({
    where: { touristId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      payment: { select: { status: true } },
      review: { select: { id: true } },
      // isPublished: a vendor can't delete a listing that has bookings (the FK
      // refuses it), but they CAN unpublish one. The detail pages filter on
      // isPublished, so linking a trip at an unpublished listing would 404 the
      // traveller out of their own booking.
      package: { select: { title: true, slug: true, coverImageUrl: true, freeCancellationDays: true, isPublished: true } },
      hotel: { select: { name: true, slug: true, coverImageUrl: true, freeCancellationDays: true, isPublished: true } },
      vehicle: { select: { title: true, coverImageUrl: true, freeCancellationDays: true, isPublished: true } },
    },
  });

  const trips: Trip[] = bookings.map((b) => {
    let listingTitle = "Listing";
    let listingImage = "";
    let listingHref = "/";
    let listingKind: ListingKind = "package";
    let freeCancellationDays = 0;
    let listingAvailable = false;

    if (b.package) {
      listingTitle = b.package.title;
      listingImage = b.package.coverImageUrl;
      listingHref = `/packages/${b.package.slug}`;
      listingKind = "package";
      freeCancellationDays = b.package.freeCancellationDays;
      listingAvailable = b.package.isPublished;
    } else if (b.hotel) {
      listingTitle = b.hotel.name;
      listingImage = b.hotel.coverImageUrl;
      listingHref = `/hotels/${b.hotel.slug}`;
      listingKind = "hotel";
      freeCancellationDays = b.hotel.freeCancellationDays;
      listingAvailable = b.hotel.isPublished;
    } else if (b.vehicle && b.vehicleId) {
      listingTitle = b.vehicle.title;
      listingImage = b.vehicle.coverImageUrl;
      listingHref = `/vehicles/${b.vehicleId}`;
      listingKind = "vehicle";
      freeCancellationDays = b.vehicle.freeCancellationDays;
      listingAvailable = b.vehicle.isPublished;
    }

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      totalAmount: b.totalAmount,
      isPaid: b.payment?.status === "PAID",
      hasReview: !!b.review,
      canPay: b.status === "PENDING" && !!b.payment && !isExpired(b.expiresAt),
      freeCancellationDays,
      listingTitle,
      listingImage,
      listingHref,
      listingKind,
      listingAvailable,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">My trips</h1>
      <TripsList trips={trips} />
    </div>
  );
}
