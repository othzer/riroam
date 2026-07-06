import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clampISODate, defaultBookingWindow, toISODate } from "@/lib/dates";
import { DetailHeader } from "@/components/tourist/detail-header";
import { DetailGallery } from "@/components/tourist/detail-gallery";
import { DetailCard, ReviewsCard } from "@/components/tourist/detail-card";
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

  const availableFrom = toISODate(pkg.availableFrom);
  const availableTo = toISODate(pkg.availableTo);

  const session = await auth();

  const reviews = await prisma.review.findMany({
    where: { packageId: pkg.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tourist: { select: { name: true } } },
  });

  const season = `${MONTH[pkg.availableFrom.getUTCMonth()]} – ${MONTH[pkg.availableTo.getUTCMonth()]}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <DetailHeader
        breadcrumb={{ label: "Packages", href: "/packages" }}
        title={pkg.title}
        altitudeMeters={pkg.maxAltitudeMeters}
        meta={[
          <span key="dur">
            {pkg.durationDays}D/{pkg.durationNights}N
          </span>,
          <span key="start">starts {pkg.startCity}</span>,
          ...(pkg.reviewCount > 0
            ? [
                <span key="rating" className="inline-flex items-center gap-1">
                  <Star className="size-3 text-rating" fill="currentColor" strokeWidth={0} />
                  {pkg.avgRating.toFixed(1)} ({pkg.reviewCount}{" "}
                  {pkg.reviewCount === 1 ? "review" : "reviews"})
                </span>,
              ]
            : []),
          <Link
            key="vendor"
            href={`/vendors/${pkg.vendor.slug}`}
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            <BadgeCheck className="size-3.5 text-pangong" />
            {pkg.vendor.businessName}
          </Link>,
          <span key="season">season {season}</span>,
        ]}
      />

      <DetailGallery
        images={[pkg.coverImageUrl, ...pkg.imageUrls]}
        alt={pkg.title}
        kind="package"
      />

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
            <DetailCard title="About this trip">
              <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-soft">
                {pkg.description}
              </p>
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
              vendorName={pkg.vendor.businessName}
              emptyBody="No reviews yet — they appear once travellers complete this trip."
            />
          </div>
          <div className="lg:sticky lg:top-24">
            <BookingCard
              packageId={pkg.id}
              pricePerPerson={pkg.pricePerPerson}
              maxGroupSize={pkg.maxGroupSize}
              freeCancellationDays={pkg.freeCancellationDays}
              availableFrom={availableFrom}
              availableTo={availableTo}
              defaultStartDate={clampISODate(
                defaultBookingWindow().start,
                availableFrom,
                availableTo,
              )}
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
