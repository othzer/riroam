import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ListingImage } from "@/components/shared/listing-image";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { ReviewCard } from "@/components/shared/review-card";
import { ItineraryCard } from "@/components/tourist/itinerary-card";
import {
  PackageExtrasProvider,
  ExtrasCard,
  BookingCard,
} from "@/components/tourist/package-booking";

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const allImages = [pkg.coverImageUrl, ...pkg.imageUrls];
  const gallery = allImages.slice(0, 3);
  const morePhotos = allImages.length - gallery.length;
  const season = `${MONTH[pkg.availableFrom.getUTCMonth()]} – ${MONTH[pkg.availableTo.getUTCMonth()]}`;

  // Server-rendered cards slotted into the client booking layout.
  const aboutCard = (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="mb-2 font-heading text-[15px] font-bold text-ink">About this trip</h2>
      <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-soft">
        {pkg.description}
      </p>
    </div>
  );

  const reviewsCard = (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="mb-1 font-heading text-[15px] font-bold text-ink">Reviews</h2>
      {reviews.length > 0 ? (
        <div className="divide-y divide-border-soft">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={{
                id: r.id,
                touristName: r.tourist.name,
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                vendorReply: r.vendorReply,
                vendorName: pkg.vendor.businessName,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-[12.5px] text-ink-muted">
          No reviews yet — they appear once travellers complete this trip.
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* breadcrumb */}
      <nav className="text-[11.5px] text-ink-muted">
        <Link href="/packages" className="hover:text-ink">
          Packages
        </Link>{" "}
        / <span className="text-ink-soft">{pkg.title}</span>
      </nav>

      {/* header */}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-extrabold text-ink">{pkg.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
            <span>
              {pkg.durationDays}D/{pkg.durationNights}N
            </span>
            <span className="text-ink-muted">·</span>
            <span>starts {pkg.startCity}</span>
            {pkg.reviewCount > 0 && (
              <>
                <span className="text-ink-muted">·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-rating text-rating" />
                  {pkg.avgRating.toFixed(1)} ({pkg.reviewCount}{" "}
                  {pkg.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </>
            )}
            <span className="text-ink-muted">·</span>
            <Link
              href={`/vendors/${pkg.vendor.slug}`}
              className="inline-flex items-center gap-1 hover:text-ink"
            >
              <BadgeCheck className="size-3.5 text-pangong" />
              {pkg.vendor.businessName}
            </Link>
            <span className="text-ink-muted">·</span>
            <span>season {season}</span>
          </div>
        </div>
        <AltitudeChip meters={pkg.maxAltitudeMeters} className="shrink-0" />
      </div>

      {/* gallery */}
      <div className="mt-4 grid h-56 grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-card bg-sand">
          <ListingImage src={gallery[0]} alt={pkg.title} kind="package" sizes="(min-width:640px) 66vw, 100vw" priority />
        </div>
        <div className="hidden grid-rows-2 gap-2 sm:grid">
          <div className="relative overflow-hidden rounded-card bg-sand">
            <ListingImage src={gallery[1] ?? gallery[0]} alt="" kind="package" sizes="33vw" />
          </div>
          <div className="relative overflow-hidden rounded-card bg-sand">
            <ListingImage src={gallery[2] ?? gallery[0]} alt="" kind="package" sizes="33vw" />
            {morePhotos > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-[12px] font-semibold text-white">
                + {morePhotos} photos
              </span>
            )}
          </div>
        </div>
      </div>

      <PackageExtrasProvider
        extras={pkg.extras.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          price: e.price,
        }))}
      >
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_308px] lg:items-start">
          <div className="min-w-0 space-y-4">
            <ItineraryCard days={pkg.itineraryDays} />
            <ExtrasCard />
            {aboutCard}
            {reviewsCard}
          </div>
          <div className="lg:sticky lg:top-24">
            <BookingCard
              packageId={pkg.id}
              pricePerPerson={pkg.pricePerPerson}
              maxGroupSize={pkg.maxGroupSize}
              freeCancellationDays={pkg.freeCancellationDays}
              availableFrom={pkg.availableFrom.toISOString().slice(0, 10)}
              availableTo={pkg.availableTo.toISOString().slice(0, 10)}
              vendorName={pkg.vendor.businessName}
              vendorSlug={pkg.vendor.slug}
              touristName={session?.user?.name ?? ""}
            />
          </div>
        </div>
      </PackageExtrasProvider>
    </div>
  );
}
