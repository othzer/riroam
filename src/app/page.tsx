import Link from "next/link";
import {
  ShieldCheck,
  Star,
  Lock,
  ArrowRight,
  Landmark,
  Waves,
  Bike,
  Home as HomeIcon,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Ridge } from "@/components/shared/ridge";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { SearchCard } from "@/components/shared/search-card";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Home() {
  const [packages, cultureCount, lakeCount, bikeCount, homestayCount] =
    await Promise.all([
      prisma.package.findMany({
        where: { isPublished: true },
        orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
        take: 3,
        include: { vendor: { select: { businessName: true } } },
      }),
      prisma.package.count({
        where: { isPublished: true, destinations: { hasSome: ["Thiksey", "Hemis"] } },
      }),
      prisma.package.count({
        where: { isPublished: true, destinations: { hasSome: ["Pangong", "Tso Moriri", "Tso Kar"] } },
      }),
      prisma.vehicleListing.count({ where: { isPublished: true, vehicleType: "BIKE" } }),
      prisma.hotel.count({ where: { isPublished: true, propertyType: "HOMESTAY" } }),
    ]);

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
          <div className="relative mx-auto max-w-6xl px-6 pt-14">
            <AltitudeChip
              label="Leh"
              meters={3524}
              className="absolute right-6 top-4 hidden sm:inline-flex"
            />
            <h1 className="max-w-[30rem] text-balance font-heading text-[40px] font-extrabold leading-[1.06] text-ink sm:text-[52px]">
              Roam the land of <span className="text-pangong">high passes.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Real itineraries from verified local vendors — bookable stays, rides
              and circuits from Leh to Zanskar.
            </p>
          </div>

          <div className="mt-9 h-36 w-full sm:h-44">
            <Ridge className="h-full" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <div className="-mt-16 sm:-mt-20">
              <SearchCard />
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-center gap-x-8 gap-y-2.5 text-xs text-ink-soft sm:flex-row">
            <Trust icon={ShieldCheck} text="Admin-verified vendors" />
            <Trust icon={Star} text="Reviews from completed trips only" />
            <Trust icon={Lock} text="Secure checkout" />
          </div>
        </section>

        {/* Featured circuits */}
        <section className="mx-auto max-w-6xl px-6 py-4">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-heading text-xl font-bold text-ink">
              Featured circuits
            </h2>
            <Link
              href="/packages"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-pangong hover:text-pangong-deep"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <section className="mx-auto max-w-6xl px-6 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CategoryTile
              href="/packages?destination=Thiksey"
              icon={Landmark}
              label="Monasteries & culture"
              count={`${cultureCount} ${cultureCount === 1 ? "circuit" : "circuits"}`}
            />
            <CategoryTile
              href="/packages?destination=Pangong"
              icon={Waves}
              label="High-altitude lakes"
              count={`${lakeCount} ${lakeCount === 1 ? "circuit" : "circuits"}`}
            />
            <CategoryTile
              href="/vehicles?type=BIKE"
              icon={Bike}
              label="Bike expeditions"
              count={`${bikeCount} ${bikeCount === 1 ? "ride" : "rides"}`}
            />
            <CategoryTile
              href="/hotels?propertyType=HOMESTAY"
              icon={HomeIcon}
              label="Homestays"
              count={`${homestayCount} ${homestayCount === 1 ? "stay" : "stays"}`}
            />
          </div>
        </section>

        {/* AI planner band — the real /plan route */}
        <section className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-card bg-ink px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Six days and a budget? Plan it with AI.
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Every suggestion is a real, bookable listing — never an invented
                hotel.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-control bg-white/10 px-3 py-2 font-mono text-[11px] text-white/70 sm:inline">
                Leh, 6 days, ₹40k, lakes…
              </span>
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 rounded-control bg-apricot px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-apricot-hover"
              >
                <Sparkles className="size-4" /> Generate plan
              </Link>
            </div>
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
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Icon className="size-4 shrink-0 text-pangong" />
      {text}
    </div>
  );
}

function CategoryTile({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-card border border-border bg-surface p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-ink/20"
    >
      <Icon className="size-5 text-pangong" />
      <span className="mt-1.5 font-heading text-[13px] font-bold leading-tight text-ink">
        {label}
      </span>
      <span className="text-[11px] text-ink-muted">{count}</span>
    </Link>
  );
}
