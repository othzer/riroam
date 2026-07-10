import Link from "next/link";
import { ShieldCheck, MessageCircleHeart, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Ridge } from "@/components/shared/ridge";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { SearchCard } from "@/components/shared/search-card";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Home() {
  const packages = await prisma.package.findMany({
    where: { isPublished: true },
    orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: { vendor: { select: { businessName: true } } },
  });

  const featured: ListingCardData[] = packages.map((p) => ({
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
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pt-16">
            <div className="flex items-start justify-between gap-6">
              <h1 className="max-w-xl text-balance font-heading text-5xl font-extrabold leading-[1.06] text-ink sm:text-6xl">
                Roam the land of <span className="text-pangong">high passes.</span>
              </h1>
              <AltitudeChip label="Leh" meters={3524} className="mt-2 hidden sm:inline-flex" />
            </div>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Verified stays, tours, and rides across Ladakh — booked direct,
              no middlemen.
            </p>
          </div>

          <div className="mt-10 h-40 w-full sm:h-48">
            <Ridge className="h-full" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <div className="-mt-20 sm:-mt-24">
              <SearchCard />
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <Trust icon={ShieldCheck} text="Verified vendors, admin-approved" />
            <Trust icon={MessageCircleHeart} text="Reviews from completed trips only" />
            <Trust icon={Lock} text="Secure checkout" />
          </div>
        </section>

        {/* Featured circuits */}
        <section className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold text-ink">
              Featured circuits
            </h2>
            <Link href="/packages" className="text-sm font-medium text-pangong hover:text-pangong-deep">
              View all
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((f) => (
                <ListingCard key={f.href} data={f} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No circuits published yet"
              body="Vendors are setting up their tours — check back soon."
            />
          )}
        </section>

        {/* Category tiles */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="mb-5 font-heading text-2xl font-bold text-ink">
            Browse by interest
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CategoryTile href="/packages?destination=Leh" label="Monasteries & culture" tint="#0D6E8F" />
            <CategoryTile href="/packages?destination=Pangong" label="High-altitude lakes" tint="#0D6E8F" />
            <CategoryTile href="/vehicles?type=BIKE" label="Bike expeditions" tint="#B07A5C" />
            <CategoryTile href="/hotels?propertyType=HOMESTAY" label="Homestays" tint="#D9A94E" />
          </div>
        </section>

        {/* AI planner teaser — Phase 6 builds the real /plan route */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-card bg-ink px-8 py-10 text-white">
            <p className="inline-block rounded-chip bg-white/10 px-2 py-0.5 font-mono text-xs tracking-wide text-white/70">
              Coming soon
            </p>
            <h2 className="mt-3 max-w-lg font-heading text-2xl font-bold">
              An AI planner that only suggests trips you can actually book
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/70">
              Every suggestion is a real, bookable listing — never an invented
              hotel.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Trust({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-ink-soft">
      <Icon className="size-4 shrink-0 text-pangong" />
      {text}
    </div>
  );
}

function CategoryTile({
  href,
  label,
  tint,
}: {
  href: string;
  label: string;
  tint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex aspect-square flex-col justify-end rounded-card border border-border p-4 transition-all duration-150 hover:-translate-y-0.5"
      style={{ backgroundColor: `${tint}14` }}
    >
      <span className="font-heading text-sm font-bold leading-tight text-ink">
        {label}
      </span>
    </Link>
  );
}
