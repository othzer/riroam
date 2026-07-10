import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListingImage } from "@/components/shared/listing-image";
import { RatingStars } from "@/components/shared/rating-stars";
import { VehicleSpecGrid } from "@/components/shared/vehicle-spec-grid";
import { EmptyState } from "@/components/shared/empty-state";
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

  const reviews = await prisma.review.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  const gallery = [vehicle.coverImageUrl, ...vehicle.imageUrls].slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/vehicles" className="hover:text-ink">Rides</Link>
        <ChevronRight className="size-3" />
        <span className="text-ink-soft">{vehicle.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">{vehicle.title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {vehicle.vehicleType === "TAXI" ? "Taxi" : "Bike"} · {vehicle.brand} {vehicle.model} · {vehicle.city}, {vehicle.state}
          </p>
          <div className="mt-2">
            <RatingStars rating={vehicle.avgRating} reviewCount={vehicle.reviewCount} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-sand sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <ListingImage src={gallery[0]} alt={vehicle.title} kind="vehicle" sizes="(min-width: 640px) 66vw, 100vw" priority />
        </div>
        {gallery.slice(1).map((img, i) => (
          <div key={i} className="relative hidden aspect-[16/10] overflow-hidden rounded-card bg-sand sm:block">
            <ListingImage src={img} alt="" kind="vehicle" sizes="33vw" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Specifications</h2>
            <VehicleSpecGrid
              seats={vehicle.seats}
              transmission={vehicle.transmission}
              fuelType={vehicle.fuelType}
            />
          </section>

          <section>
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Reviews</h2>
            {reviews.length > 0 ? (
              <div className="divide-y divide-border-soft rounded-card border border-border bg-surface px-4">
                {reviews.map((r) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{r.tourist.name}</p>
                      <RatingStars rating={r.rating} reviewCount={1} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No reviews yet" body="Reviews appear here once tourists complete their trip." />
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <DateRangeBookingWidget
            pricePerUnit={vehicle.pricePerDay}
            unitLabel="day"
            freeCancellationDays={vehicle.freeCancellationDays}
            vendorName={vehicle.vendor.businessName}
            vendorSlug={vehicle.vendor.slug}
            startLabel="Pickup"
            endLabel="Return"
          />
        </div>
      </div>
    </div>
  );
}
