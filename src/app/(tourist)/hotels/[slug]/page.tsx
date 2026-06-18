import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ListingImage } from "@/components/shared/listing-image";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { RatingStars } from "@/components/shared/rating-stars";
import { AmenityGrid } from "@/components/shared/amenity-grid";
import { LeafletMap } from "@/components/shared/leaflet-map";
import { EmptyState } from "@/components/shared/empty-state";
import { HotelBookingSection } from "@/components/tourist/hotel-booking-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug, isPublished: true },
    select: { name: true },
  });
  return { title: hotel?.name ?? "Stay" };
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug, isPublished: true },
    include: {
      vendor: { select: { businessName: true, slug: true } },
      rooms: { orderBy: { pricePerNight: "asc" } },
    },
  });
  if (!hotel || hotel.rooms.length === 0) notFound();

  const session = await auth();

  const reviews = await prisma.review.findMany({
    where: { hotelId: hotel.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  const gallery = [hotel.coverImageUrl, ...hotel.imageUrls].slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/hotels" className="hover:text-ink">Stays</Link>
        <ChevronRight className="size-3" />
        <span className="text-ink-soft">{hotel.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">{hotel.name}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {hotel.address}, {hotel.city}, {hotel.state}
          </p>
          <div className="mt-2">
            <RatingStars rating={hotel.avgRating} reviewCount={hotel.reviewCount} />
          </div>
        </div>
        {hotel.altitudeMeters != null && <AltitudeChip meters={hotel.altitudeMeters} />}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-sand sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <ListingImage src={gallery[0]} alt={hotel.name} kind="hotel" sizes="(min-width: 640px) 66vw, 100vw" priority />
        </div>
        {gallery.slice(1).map((img, i) => (
          <div key={i} className="relative hidden aspect-[16/10] overflow-hidden rounded-card bg-sand sm:block">
            <ListingImage src={img} alt="" kind="hotel" sizes="33vw" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">About</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {hotel.description}
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">Amenities</h2>
          <AmenityGrid amenities={hotel.amenities} />
        </section>

        <HotelBookingSection
          hotelId={hotel.id}
          rooms={hotel.rooms.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            pricePerNight: r.pricePerNight,
            capacity: r.capacity,
            totalUnits: r.totalUnits,
          }))}
          freeCancellationDays={hotel.freeCancellationDays}
          vendorName={hotel.vendor.businessName}
          vendorSlug={hotel.vendor.slug}
          touristName={session?.user?.name ?? ""}
        />

        {hotel.latitude != null && hotel.longitude != null && (
          <section>
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Location</h2>
            <LeafletMap lat={hotel.latitude} lng={hotel.longitude} label={hotel.name} />
          </section>
        )}

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
            <EmptyState title="No reviews yet" body="Reviews appear here once tourists complete their stay." />
          )}
        </section>
      </div>
    </div>
  );
}
