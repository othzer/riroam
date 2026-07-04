import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { defaultBookingWindow, toISODate } from "@/lib/dates";
import { AmenityGrid } from "@/components/shared/amenity-grid";
import { LeafletMap } from "@/components/shared/leaflet-map";
import { DetailHeader } from "@/components/tourist/detail-header";
import { DetailGallery } from "@/components/tourist/detail-gallery";
import { DetailCard, ReviewsCard } from "@/components/tourist/detail-card";
import {
  HotelRoomProvider,
  RoomsCard,
  HotelBookingCard,
} from "@/components/tourist/hotel-rooms";

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
  const bookingWindow = defaultBookingWindow();

  const reviews = await prisma.review.findMany({
    where: { hotelId: hotel.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <DetailHeader
        breadcrumb={{ label: "Stays", href: "/hotels" }}
        title={hotel.name}
        altitudeMeters={hotel.altitudeMeters}
        meta={[
          <span key="type">{hotel.propertyType === "HOMESTAY" ? "Homestay" : "Hotel"}</span>,
          <span key="loc">
            {hotel.city}, {hotel.state}
          </span>,
          ...(hotel.reviewCount > 0
            ? [
                <span key="rating" className="inline-flex items-center gap-1">
                  <Star className="size-3 text-rating" fill="currentColor" strokeWidth={0} />
                  {hotel.avgRating.toFixed(1)} ({hotel.reviewCount})
                </span>,
              ]
            : []),
        ]}
      />

      <DetailGallery
        images={[hotel.coverImageUrl, ...hotel.imageUrls]}
        alt={hotel.name}
        kind="hotel"
      />

      <HotelRoomProvider
        rooms={hotel.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          pricePerNight: r.pricePerNight,
          capacity: r.capacity,
          totalUnits: r.totalUnits,
        }))}
      >
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_308px] lg:items-start">
          <div className="min-w-0 space-y-4">
            <DetailCard title="About">
              <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-soft">
                {hotel.description}
              </p>
            </DetailCard>

            {hotel.amenities.length > 0 && (
              <DetailCard title="Amenities">
                <AmenityGrid amenities={hotel.amenities} />
              </DetailCard>
            )}

            <RoomsCard />

            {hotel.latitude != null && hotel.longitude != null && (
              <DetailCard title="Location">
                <LeafletMap lat={hotel.latitude} lng={hotel.longitude} label={hotel.name} />
              </DetailCard>
            )}

            <ReviewsCard
              reviews={reviews.map((r) => ({
                id: r.id,
                touristName: r.tourist.name,
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                vendorReply: r.vendorReply,
              }))}
              vendorName={hotel.vendor.businessName}
              emptyBody="Reviews appear here once guests complete their stay."
            />
          </div>

          <div className="lg:sticky lg:top-24">
            <HotelBookingCard
              hotelId={hotel.id}
              freeCancellationDays={hotel.freeCancellationDays}
              vendorName={hotel.vendor.businessName}
              vendorSlug={hotel.vendor.slug}
              touristName={session?.user?.name ?? ""}
              defaultStart={bookingWindow.start}
              defaultEnd={bookingWindow.end}
              today={toISODate(new Date())}
            />
          </div>
        </div>
      </HotelRoomProvider>
    </div>
  );
}
