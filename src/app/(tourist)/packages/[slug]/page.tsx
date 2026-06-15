import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { ListingImage } from "@/components/shared/listing-image";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { RatingStars } from "@/components/shared/rating-stars";
import { SeasonTag } from "@/components/shared/season-tag";
import { ElevationProfile } from "@/components/shared/elevation-profile";
import { DayList } from "@/components/shared/day-list";
import { AcclimatizationCallout } from "@/components/shared/acclimatization-callout";
import { EmptyState } from "@/components/shared/empty-state";
import { PackageBookingWidget } from "@/components/tourist/package-booking-widget";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await prisma.package.findUnique({
    where: { slug, isPublished: true },
    select: { title: true },
  });
  return { title: pkg?.title ?? "Package" };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const pkg = await prisma.package.findUnique({
    where: { slug, isPublished: true },
    include: {
      vendor: { select: { businessName: true, slug: true } },
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      extras: true,
    },
  });
  if (!pkg) notFound();

  const session = await auth();

  const reviews = await prisma.review.findMany({
    where: { packageId: pkg.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  const gallery = [pkg.coverImageUrl, ...pkg.imageUrls].slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/packages" className="hover:text-ink">Packages</Link>
        <ChevronRight className="size-3" />
        <span className="text-ink-soft">{pkg.title}</span>
      </nav>

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">{pkg.title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {pkg.startCity} → {pkg.destinations.join(" → ")} · {pkg.durationDays}D/{pkg.durationNights}N
          </p>
          <div className="mt-2 flex items-center gap-3">
            <RatingStars rating={pkg.avgRating} reviewCount={pkg.reviewCount} />
            <SeasonTag from={pkg.availableFrom} to={pkg.availableTo} />
          </div>
        </div>
        <AltitudeChip meters={pkg.maxAltitudeMeters} />
      </div>

      {/* gallery */}
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:grid-rows-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-sand sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <ListingImage src={gallery[0]} alt={pkg.title} kind="package" sizes="(min-width: 640px) 66vw, 100vw" priority />
        </div>
        {gallery.slice(1).map((img, i) => (
          <div key={i} className="relative hidden aspect-[16/10] overflow-hidden rounded-card bg-sand sm:block">
            <ListingImage src={img} alt="" kind="package" sizes="33vw" />
          </div>
        ))}
      </div>

      {/* two-column */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-ink">Itinerary</h2>
            <div className="rounded-card border border-border bg-surface p-4">
              <ElevationProfile
                days={pkg.itineraryDays.map((d) => ({
                  dayNumber: d.dayNumber,
                  altitudeMeters: d.altitudeMeters,
                  passName: /la\b/i.test(d.title) ? d.title.split("—").pop()?.trim() : undefined,
                }))}
              />
            </div>
            <div className="mt-3">
              <DayList
                days={pkg.itineraryDays.map((d) => ({
                  dayNumber: d.dayNumber,
                  title: d.title,
                  location: d.location,
                  altitudeMeters: d.altitudeMeters,
                }))}
              />
            </div>
          </section>

          <AcclimatizationCallout days={pkg.itineraryDays} />

          <section>
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">About this trip</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {pkg.description}
            </p>
          </section>

          {pkg.extras.length > 0 && (
            <section>
              <h2 className="mb-3 font-heading text-xl font-bold text-ink">Extras available</h2>
              <div className="divide-y divide-border-soft rounded-card border border-border bg-surface px-4">
                {pkg.extras.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{e.name}</p>
                      {e.description && (
                        <p className="text-xs text-ink-muted">{e.description}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-ink-soft">
                      {formatINR(e.price)}
                    </span>
                  </div>
                ))}
              </div>
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
              <EmptyState
                title="No reviews yet"
                body="Reviews appear here once tourists complete this trip."
              />
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <PackageBookingWidget
            packageId={pkg.id}
            pricePerPerson={pkg.pricePerPerson}
            maxGroupSize={pkg.maxGroupSize}
            freeCancellationDays={pkg.freeCancellationDays}
            availableFrom={pkg.availableFrom.toISOString().slice(0, 10)}
            availableTo={pkg.availableTo.toISOString().slice(0, 10)}
            extras={pkg.extras.map((e) => ({ id: e.id, name: e.name, price: e.price }))}
            vendorName={pkg.vendor.businessName}
            vendorSlug={pkg.vendor.slug}
            touristName={session?.user?.name ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
