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
import { toISODate } from "@/lib/dates";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Ridge } from "@/components/shared/ridge";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { SearchCard } from "@/components/shared/search-card";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { UpcomingTrip } from "@/components/tourist/upcoming-trip";

export default async function Home() {
  const [packages, cultureCount, lakeCount, bikeCount, homestayCount, reviews] =
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
      // Real traveller words for the testimonial band — reviews only exist for
      // COMPLETED trips, so every quote here is from someone who actually went.
      prisma.review.findMany({
        where: { rating: { gte: 4 } },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        take: 3,
        include: {
          tourist: { select: { name: true } },
          booking: {
            select: {
              package: { select: { title: true } },
              hotel: { select: { name: true } },
              vehicle: { select: { title: true } },
            },
          },
        },
      }),
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
          {/* ambient light — two soft colour fields behind the heading, so the
              hero reads as morning light on the range rather than flat paper */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-pangong/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-[8%] h-64 w-64 rounded-full bg-apricot/15 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-6 pt-14">
            <AltitudeChip
              label="Leh"
              meters={3524}
              className="absolute right-6 top-4 hidden sm:inline-flex"
            />
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-pangong">
              The high-altitude marketplace
            </p>
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
              <SearchCard today={toISODate(new Date())} />
            </div>
          </div>
        </section>

        {/* Renders only for a signed-in traveller with a trip coming up */}
        <UpcomingTrip />

        {/* Trust cards */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <TrustCard
              icon={ShieldCheck}
              title="Verified, not scraped"
              body="Every vendor is a real Ladakhi business, reviewed and approved by hand before a single listing goes live."
            />
            <TrustCard
              icon={Star}
              title="Reviews you can trust"
              body="Only travellers who completed a trip can leave a review — no bots, no bought stars, no exceptions."
            />
            <TrustCard
              icon={Lock}
              title="Book without the leap"
              body="Secure checkout, a 20-minute price hold, and free cancellation windows on every listing."
            />
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

        {/* Ladakh in numbers — the scale of the place, in figures */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-card border border-border bg-surface px-6 py-8 shadow-card">
            <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              Ladakh in numbers
            </p>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <BigStat value="5,359 m" label="Khardung La — among the world's highest motorable passes" />
              <BigStat value="134 km" label="length of Pangong Tso, stretching into Tibet" />
              <BigStat value="300+" label="days of sunshine a year in this cold desert" />
              <BigStat value="3,524 m" label="the altitude you land at in Leh — acclimatize first" />
            </div>
          </div>
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
          <div className="flex flex-col items-start justify-between gap-4 rounded-card bg-ink px-6 py-5 shadow-[0_20px_50px_-16px_rgba(24,38,53,0.45)] sm:flex-row sm:items-center">
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

        {/* Traveller words — real reviews, only from completed trips */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-10">
            <div className="mb-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-pangong">
                From the road journals
              </p>
              <h2 className="mt-1 font-heading text-xl font-bold text-ink">
                Travellers who went, and came back glowing
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {reviews.map((r) => (
                <figure
                  key={r.id}
                  className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-card"
                >
                  <div className="flex items-center gap-0.5 text-rating" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                    &ldquo;{r.comment.length > 180 ? `${r.comment.slice(0, 180)}…` : r.comment}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 border-t border-border-soft pt-3 text-xs">
                    <span className="font-semibold text-ink">{r.tourist.name}</span>
                    <span className="text-ink-muted">
                      {" · "}
                      {r.booking.package?.title ?? r.booking.hotel?.name ?? r.booking.vehicle?.title ?? "RiRoam trip"}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* The proverb every Ladakh guidebook opens with — earned its place */}
        <section className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="font-heading text-xl font-medium italic leading-relaxed text-ink sm:text-2xl">
            &ldquo;The land is so barren and the passes so high that only the best
            of friends or the fiercest of enemies would want to visit us.&rdquo;
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
            — old Ladakhi saying
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TrustCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      <span className="inline-flex size-9 items-center justify-center rounded-control bg-pangong-tint">
        <Icon className="size-4.5 text-pangong" />
      </span>
      <h3 className="mt-3 font-heading text-[15px] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-2xl font-bold tracking-tight text-pangong sm:text-3xl">
        {value}
      </p>
      <p className="mx-auto mt-1.5 max-w-[180px] text-[11.5px] leading-snug text-ink-muted">
        {label}
      </p>
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
      className="group flex flex-col gap-1 rounded-card border border-border bg-surface p-3.5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-pangong/25 hover:shadow-card-hover"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-control bg-pangong-tint transition-colors group-hover:bg-pangong group-hover:text-white">
        <Icon className="size-4 text-pangong transition-colors group-hover:text-white" />
      </span>
      <span className="mt-1.5 font-heading text-[13px] font-bold leading-tight text-ink">
        {label}
      </span>
      <span className="text-[11px] text-ink-muted">{count}</span>
    </Link>
  );
}
