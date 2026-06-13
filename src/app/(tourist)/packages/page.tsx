import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildPackageWhere, getPage, pageHref, PAGE_SIZE, type SearchParams } from "@/lib/filters";
import { FilterBar } from "@/components/shared/filter-bar";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const where = buildPackageWhere(sp);
  const page = getPage(sp);

  const [total, packages] = await Promise.all([
    prisma.package.count({ where }),
    prisma.package.findMany({
      where,
      orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { vendor: { select: { businessName: true } } },
    }),
  ]);

  const cards: ListingCardData[] = packages.map((p) => ({
    href: `/packages/${p.slug}`,
    kind: "package",
    image: p.coverImageUrl,
    imageAlt: `${p.title} — ${p.destinations.join(", ")}`,
    title: p.title,
    routeLine: `${p.startCity} → ${p.destinations.join(" → ")} · ${p.durationDays}D/${p.durationNights}N`,
    priceLabel: "/person",
    priceAmount: p.pricePerPerson,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    vendorName: p.vendor.businessName,
    altitudeMeters: p.maxAltitudeMeters,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">
        Packages
      </h1>
      <p className="mb-5 text-sm text-ink-muted">
        {total} circuit{total === 1 ? "" : "s"} found
      </p>

      <FilterBar basePath="/packages" variant="packages" searchParams={sp} />

      {cards.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ListingCard key={c.href} data={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No packages match those filters"
          body="Try widening your budget or clearing a filter."
          ctaLabel="Clear filters"
          ctaHref="/packages"
        />
      )}

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        buildHref={(p) => pageHref("/packages", sp, p)}
      />
    </div>
  );
}
