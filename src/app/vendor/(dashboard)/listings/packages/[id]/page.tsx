import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paiseToRupees } from "@/lib/money";
import { PackageForm } from "@/components/vendor/package-form";
import type { PackageInput } from "@/lib/validators/listings";

export const metadata: Metadata = { title: "Edit package" };

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      extras: true,
    },
  });
  if (!pkg || pkg.vendorId !== vendor.id) notFound();

  const initial: PackageInput = {
    title: pkg.title,
    description: pkg.description,
    destinations: pkg.destinations,
    startCity: pkg.startCity,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    pricePerPerson: paiseToRupees(pkg.pricePerPerson),
    maxGroupSize: pkg.maxGroupSize,
    availableFrom: toDateInput(pkg.availableFrom),
    availableTo: toDateInput(pkg.availableTo),
    freeCancellationDays: pkg.freeCancellationDays,
    coverImageUrl: pkg.coverImageUrl,
    imageUrls: pkg.imageUrls,
    itineraryDays: pkg.itineraryDays.map((d) => ({
      title: d.title,
      location: d.location,
      altitudeMeters: d.altitudeMeters,
      description: d.description,
    })),
    extras: pkg.extras.map((e) => ({
      extraId: e.id,
      name: e.name,
      description: e.description ?? "",
      price: paiseToRupees(e.price),
    })),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">
        Edit package
      </h1>
      <PackageForm packageId={pkg.id} initial={initial} />
    </div>
  );
}
