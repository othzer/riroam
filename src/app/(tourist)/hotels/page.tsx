import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildHotelWhere, getPage, pageHref, PAGE_SIZE, type SearchParams } from "@/lib/filters";
import { FilterBar } from "@/components/shared/filter-bar";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

export const metadata: Metadata = { title: "Stays" };

export default async function HotelsExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const where = buildHotelWhere(sp);
  const page = getPage(sp);

  const [total, hotels] = await Promise.all([
    prisma.hotel.count({ where }),
    prisma.hotel.findMany({
      where,
      orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        vendor: { select: { businessName: true } },
        rooms: { orderBy: { pricePerNight: "asc" }, take: 1 },
      },
    }),
  ]);

  const cards: ListingCardData[] = hotels
    .filter((h) => h.rooms.length > 0)
    .map((h) => ({
      href: `/hotels/${h.slug}`,
      kind: "hotel",
      image: h.coverImageUrl,
      imageAlt: `${h.name} — ${h.city}`,
      title: h.name,
      routeLine: `${h.city}, ${h.state}`,
      priceLabel: "/night",
      priceAmount: h.rooms[0].pricePerNight,
      avgRating: h.avgRating,
      reviewCount: h.reviewCount,
      vendorName: h.vendor.businessName,
      altitudeMeters: h.altitudeMeters ?? undefined,
    }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Stays</h1>
      <p className="mb-5 text-sm text-ink-muted">
        {total} stay{total === 1 ? "" : "s"} found
      </p>

      <FilterBar basePath="/hotels" variant="hotels" searchParams={sp} />

      {cards.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ListingCard key={c.href} data={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No stays match those filters"
          body="Try widening your budget or clearing a filter."
          ctaLabel="Clear filters"
          ctaHref="/hotels"
        />
      )}

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        buildHref={(p) => pageHref("/hotels", sp, p)}
      />
    </div>
  );
}
