import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildVehicleWhere, getPage, pageHref, PAGE_SIZE, type SearchParams } from "@/lib/filters";
import { FilterBar } from "@/components/shared/filter-bar";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

export const metadata: Metadata = { title: "Rides" };

export default async function VehiclesExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const where = buildVehicleWhere(sp);
  const page = getPage(sp);

  const [total, vehicles] = await Promise.all([
    prisma.vehicleListing.count({ where }),
    prisma.vehicleListing.findMany({
      where,
      orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { vendor: { select: { businessName: true } } },
    }),
  ]);

  const cards: ListingCardData[] = vehicles.map((v) => ({
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Rides</h1>
      <p className="mb-5 text-sm text-ink-muted">
        {total} vehicle{total === 1 ? "" : "s"} found
      </p>

      <FilterBar basePath="/vehicles" variant="vehicles" searchParams={sp} />

      {cards.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ListingCard key={c.href} data={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No vehicles match those filters"
          body="Try widening your budget or clearing a filter."
          ctaLabel="Clear filters"
          ctaHref="/vehicles"
        />
      )}

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        buildHref={(p) => pageHref("/vehicles", sp, p)}
      />
    </div>
  );
}
