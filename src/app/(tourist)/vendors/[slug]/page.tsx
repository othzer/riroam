import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Ridge } from "@/components/shared/ridge";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { StorefrontTabs } from "@/components/tourist/storefront-tabs";
import type { ListingCardData } from "@/components/shared/listing-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug },
    select: { businessName: true },
  });
  return { title: vendor?.businessName ?? "Storefront" };
}

export default async function VendorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      packages: { where: { isPublished: true }, orderBy: { createdAt: "desc" } },
      hotels: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        include: { rooms: { orderBy: { pricePerNight: "asc" }, take: 1 } },
      },
      vehicles: { where: { isPublished: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!vendor) notFound();

  const [reviews, tripsCompleted] = await Promise.all([
    prisma.review.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { tourist: { select: { name: true } } },
    }),
    prisma.booking.count({
      where: { vendorId: vendor.id, status: BookingStatus.COMPLETED },
    }),
  ]);

  const listingCount = vendor.packages.length + vendor.hotels.length + vendor.vehicles.length;
  const avgRating =
    listingCount === 0
      ? 0
      : [...vendor.packages, ...vendor.hotels, ...vendor.vehicles].reduce(
          (sum, l) => sum + l.avgRating,
          0,
        ) / listingCount;

  const packageCards: ListingCardData[] = vendor.packages.map((p) => ({
    href: `/packages/${p.slug}`,
    kind: "package",
    image: p.coverImageUrl,
    imageAlt: p.title,
    title: p.title,
    routeLine: `${p.startCity} → ${p.destinations.join(" → ")} · ${p.durationDays}D/${p.durationNights}N`,
    priceLabel: "/person",
    priceAmount: p.pricePerPerson,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    vendorName: vendor.businessName,
    altitudeMeters: p.maxAltitudeMeters,
  }));

  const hotelCards: ListingCardData[] = vendor.hotels
    .filter((h) => h.rooms.length > 0)
    .map((h) => ({
      href: `/hotels/${h.slug}`,
      kind: "hotel",
      image: h.coverImageUrl,
      imageAlt: h.name,
      title: h.name,
      routeLine: `${h.city}, ${h.state}`,
      priceLabel: "/night",
      priceAmount: h.rooms[0].pricePerNight,
      avgRating: h.avgRating,
      reviewCount: h.reviewCount,
      vendorName: vendor.businessName,
      altitudeMeters: h.altitudeMeters ?? undefined,
    }));

  const vehicleCards: ListingCardData[] = vendor.vehicles.map((v) => ({
    href: `/vehicles/${v.id}`,
    kind: "vehicle",
    image: v.coverImageUrl,
    imageAlt: v.title,
    title: v.title,
    routeLine: `${v.vehicleType === "TAXI" ? "Taxi" : "Bike"} · ${v.city}`,
    priceLabel: "/day",
    priceAmount: v.pricePerDay,
    avgRating: v.avgRating,
    reviewCount: v.reviewCount,
    vendorName: vendor.businessName,
  }));

  return (
    <div>
      {/* banner — accentColor tints ONLY here and the underline accent below */}
      <div className="relative h-40 w-full overflow-hidden sm:h-56">
        {vendor.bannerUrl ? (
          <Image src={vendor.bannerUrl} alt="" fill className="object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `${vendor.accentColor ?? "#0D6E8F"}22` }}
          >
            <Ridge className="h-full" />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-paper bg-surface sm:size-24">
            {vendor.logoUrl ? (
              <Image src={vendor.logoUrl} alt={vendor.businessName} width={96} height={96} className="object-cover" />
            ) : (
              <span className="font-heading text-2xl font-bold text-pangong">
                {vendor.businessName[0]}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-ink">
              {vendor.businessName}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-pangong">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          </div>
          {vendor.tagline && (
            <p
              className="mt-1 inline-block border-b-2 pb-0.5 text-sm text-ink-soft"
              style={{ borderColor: vendor.accentColor ?? "#0D6E8F" }}
            >
              {vendor.tagline}
            </p>
          )}
        </div>

        {/* stats row */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-y border-border py-4">
          <Stat label="Listings" value={String(listingCount)} />
          <Stat label="Avg rating" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
          <Stat label="Trips completed" value={String(tripsCompleted)} />
        </div>

        <div className="py-8">
          <StorefrontTabs
            tabs={[
              { key: "packages", label: "Packages", items: packageCards },
              { key: "hotels", label: "Stays", items: hotelCards },
              { key: "vehicles", label: "Rides", items: vehicleCards },
            ]}
          />
        </div>

        <section className="pb-12">
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
                  {r.vendorReply && (
                    <div className="mt-2 border-l-2 border-border pl-3 text-sm text-ink-soft">
                      <span className="font-medium text-ink">{vendor.businessName}:</span>{" "}
                      {r.vendorReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" body="Reviews appear once trips with this vendor are completed." />
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
