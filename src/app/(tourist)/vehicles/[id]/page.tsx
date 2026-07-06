import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { defaultBookingWindow, toISODate } from "@/lib/dates";
import { VehicleSpecGrid } from "@/components/shared/vehicle-spec-grid";
import { DetailHeader } from "@/components/tourist/detail-header";
import { DetailGallery } from "@/components/tourist/detail-gallery";
import { DetailCard, ReviewsCard } from "@/components/tourist/detail-card";
import { DateRangeBookingWidget } from "@/components/tourist/date-range-booking-widget";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await prisma.vehicleListing.findUnique({
    where: { id, isPublished: true },
    select: { title: true },
  });
  return { title: vehicle?.title ?? "Vehicle" };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await prisma.vehicleListing.findUnique({
    where: { id, isPublished: true },
    include: { vendor: { select: { businessName: true, slug: true } } },
  });
  if (!vehicle) notFound();

  const session = await auth();
  const bookingWindow = defaultBookingWindow();

  const reviews = await prisma.review.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <DetailHeader
        breadcrumb={{ label: "Rides", href: "/vehicles" }}
        title={vehicle.title}
        meta={[
          <span key="type">{vehicle.vehicleType === "TAXI" ? "Taxi" : "Bike"}</span>,
          <span key="bm">
            {vehicle.brand} {vehicle.model}
          </span>,
          <span key="loc">
            {vehicle.city}, {vehicle.state}
          </span>,
          ...(vehicle.reviewCount > 0
            ? [
                <span key="rating" className="inline-flex items-center gap-1">
                  <Star className="size-3 text-rating" fill="currentColor" strokeWidth={0} />
                  {vehicle.avgRating.toFixed(1)} ({vehicle.reviewCount})
                </span>,
              ]
            : []),
        ]}
      />

      <DetailGallery
        images={[vehicle.coverImageUrl, ...vehicle.imageUrls]}
        alt={vehicle.title}
        kind="vehicle"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_308px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <DetailCard title="Specifications">
            <VehicleSpecGrid
              seats={vehicle.seats}
              transmission={vehicle.transmission}
              fuelType={vehicle.fuelType}
            />
          </DetailCard>

          <ReviewsCard
            reviews={reviews.map((r) => ({
              id: r.id,
              touristName: r.tourist.name,
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              vendorReply: r.vendorReply,
            }))}
            vendorName={vehicle.vendor.businessName}
            emptyBody="Reviews appear here once travellers complete their trip."
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <DateRangeBookingWidget
            target={{ bookingType: "VEHICLE", vehicleId: vehicle.id }}
            pricePerUnit={vehicle.pricePerDay}
            unitLabel="day"
            unitNoun="Vehicles"
            maxUnits={vehicle.totalUnits}
            maxGuestsPerUnit={vehicle.seats ?? 4}
            freeCancellationDays={vehicle.freeCancellationDays}
            vendorName={vehicle.vendor.businessName}
            vendorSlug={vehicle.vendor.slug}
            touristName={session?.user?.name ?? ""}
            defaultStart={bookingWindow.start}
            defaultEnd={bookingWindow.end}
            today={toISODate(new Date())}
            startLabel="Pickup"
            endLabel="Return"
          />
        </div>
      </div>
    </div>
  );
}
