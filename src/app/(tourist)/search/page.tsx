import Link from "next/link";
import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BadgeCheck } from "lucide-react";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const hasQuery = query.length > 0;
  const ci = { contains: query, mode: "insensitive" as const };

  const [packages, hotels, vehicles, vendors] = hasQuery
    ? await Promise.all([
        prisma.package.findMany({
          where: {
            isPublished: true,
            OR: [{ title: ci }, { startCity: ci }, { destinations: { has: query } }],
          },
          take: 6,
          include: { vendor: { select: { businessName: true } } },
        }),
        prisma.hotel.findMany({
          where: { isPublished: true, OR: [{ name: ci }, { city: ci }] },
          take: 6,
          include: {
            vendor: { select: { businessName: true } },
            rooms: { orderBy: { pricePerNight: "asc" }, take: 1 },
          },
        }),
        prisma.vehicleListing.findMany({
          where: { isPublished: true, OR: [{ title: ci }, { city: ci }] },
          take: 6,
          include: { vendor: { select: { businessName: true } } },
        }),
        prisma.vendorProfile.findMany({
          where: { status: "APPROVED", businessName: ci },
          take: 6,
        }),
      ])
    : [[], [], [], []] as const;

  const packageCards: ListingCardData[] = packages.map((p) => ({
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
    vendorName: p.vendor.businessName,
    altitudeMeters: p.maxAltitudeMeters,
  }));

  const hotelCards: ListingCardData[] = hotels
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
      vendorName: h.vendor.businessName,
      altitudeMeters: h.altitudeMeters ?? undefined,
    }));

  const vehicleCards: ListingCardData[] = vehicles.map((v) => ({
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
    vendorName: v.vendor.businessName,
  }));

  const totalResults =
    packageCards.length + hotelCards.length + vehicleCards.length + vendors.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Search</h1>

      <form action="/search" method="get" className="mb-8 mt-4 max-w-lg">
        <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2">
          <SearchIcon className="size-4 shrink-0 text-ink-muted" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search circuits, stays, rides, vendors…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
      </form>

      {!hasQuery ? (
        <EmptyState title="Search RiRoam" body="Try a destination, listing name, or vendor." />
      ) : totalResults === 0 ? (
        <EmptyState
          title={`No results for "${query}"`}
          body="Try a different destination or a broader term."
          ctaLabel="Explore packages"
          ctaHref="/packages"
        />
      ) : (
        <div className="space-y-10">
          {vendors.length > 0 && (
            <ResultSection title="Vendors">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.slug}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-4 py-3 transition-colors hover:border-ink/20"
                  >
                    <span className="font-medium text-ink">{v.businessName}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                      <BadgeCheck className="size-3.5 text-pangong" /> {v.city}
                    </span>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}
          {packageCards.length > 0 && (
            <ResultSection title="Packages">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {packageCards.map((c) => <ListingCard key={c.href} data={c} />)}
              </div>
            </ResultSection>
          )}
          {hotelCards.length > 0 && (
            <ResultSection title="Stays">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hotelCards.map((c) => <ListingCard key={c.href} data={c} />)}
              </div>
            </ResultSection>
          )}
          {vehicleCards.length > 0 && (
            <ResultSection title="Rides">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {vehicleCards.map((c) => <ListingCard key={c.href} data={c} />)}
              </div>
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
