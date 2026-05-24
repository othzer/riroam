import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { VendorStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { ListingActions } from "@/components/vendor/listing-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Listings" };

export default async function VendorListingsPage() {
  const { vendor } = await requireVendor();

  const [packages, hotels, vehicles] = await Promise.all([
    prisma.package.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hotel.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { rooms: true } } },
    }),
    prisma.vehicleListing.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const notApproved = vendor.status !== VendorStatus.APPROVED;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Listings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create and manage your packages, stays, and vehicles.
        </p>
      </div>

      {notApproved && (
        <div className="mb-6 rounded-control border border-border bg-sand-deep px-4 py-3 text-sm text-ink">
          You can draft listings now, but publishing unlocks once your account is
          approved.
        </div>
      )}

      <Section
        title="Packages"
        newHref="/vendor/listings/packages/new"
        empty={packages.length === 0}
      >
        {packages.map((p) => (
          <Row
            key={p.id}
            image={p.coverImageUrl}
            title={p.title}
            subtitle={`${p.startCity} · ${p.durationDays}D/${p.durationNights}N · ${formatINR(p.pricePerPerson)}/person`}
            isPublished={p.isPublished}
            type="package"
            id={p.id}
            editHref={`/vendor/listings/packages/${p.id}`}
          />
        ))}
      </Section>

      <Section
        title="Hotels & homestays"
        newHref="/vendor/listings/hotels/new"
        empty={hotels.length === 0}
      >
        {hotels.map((h) => (
          <Row
            key={h.id}
            image={h.coverImageUrl}
            title={h.name}
            subtitle={`${h.city} · ${h._count.rooms} room type${h._count.rooms === 1 ? "" : "s"}`}
            isPublished={h.isPublished}
            type="hotel"
            id={h.id}
            editHref={`/vendor/listings/hotels/${h.id}`}
          />
        ))}
      </Section>

      <Section
        title="Vehicles"
        newHref="/vendor/listings/vehicles/new"
        empty={vehicles.length === 0}
      >
        {vehicles.map((v) => (
          <Row
            key={v.id}
            image={v.coverImageUrl}
            title={v.title}
            subtitle={`${v.vehicleType === "TAXI" ? "Taxi" : "Bike"} · ${v.city} · ${formatINR(v.pricePerDay)}/day`}
            isPublished={v.isPublished}
            type="vehicle"
            id={v.id}
            editHref={`/vendor/listings/vehicles/${v.id}`}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  newHref,
  empty,
  children,
}: {
  title: string;
  newHref: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
        <Link
          href={newHref}
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          <Plus className="size-4" /> New
        </Link>
      </div>
      {empty ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
          Nothing here yet.
        </p>
      ) : (
        <div className="divide-y divide-border-soft overflow-hidden rounded-card border border-border bg-surface">
          {children}
        </div>
      )}
    </section>
  );
}

function Row({
  image,
  title,
  subtitle,
  isPublished,
  type,
  id,
  editHref,
}: {
  image: string;
  title: string;
  subtitle: string;
  isPublished: boolean;
  type: "package" | "hotel" | "vehicle";
  id: string;
  editHref: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-control bg-sand">
        <Image src={image} alt="" fill className="object-cover" sizes="64px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-ink">{title}</p>
          <span
            className={cn(
              "shrink-0 rounded-chip px-1.5 py-0.5 text-[11px] font-medium",
              isPublished
                ? "bg-success-tint text-success"
                : "bg-sand text-ink-soft",
            )}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <p className="truncate text-xs text-ink-muted">{subtitle}</p>
      </div>
      <ListingActions
        type={type}
        id={id}
        isPublished={isPublished}
        editHref={editHref}
      />
    </div>
  );
}
