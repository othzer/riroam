import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paiseToRupees } from "@/lib/money";
import { VehicleForm } from "@/components/vendor/vehicle-form";
import type { VehicleInput } from "@/lib/validators/listings";

export const metadata: Metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  const vehicle = await prisma.vehicleListing.findUnique({ where: { id } });
  if (!vehicle || vehicle.vendorId !== vendor.id) notFound();

  const initial: VehicleInput = {
    vehicleType: vehicle.vehicleType,
    title: vehicle.title,
    brand: vehicle.brand,
    model: vehicle.model,
    city: vehicle.city,
    state: vehicle.state,
    pricePerDay: paiseToRupees(vehicle.pricePerDay),
    seats: vehicle.seats ?? undefined,
    transmission: vehicle.transmission ?? "",
    fuelType: vehicle.fuelType ?? "",
    totalUnits: vehicle.totalUnits,
    freeCancellationDays: vehicle.freeCancellationDays,
    coverImageUrl: vehicle.coverImageUrl,
    imageUrls: vehicle.imageUrls,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">
        Edit vehicle
      </h1>
      <VehicleForm vehicleId={vehicle.id} initial={initial} />
    </div>
  );
}
