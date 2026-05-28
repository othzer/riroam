import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paiseToRupees } from "@/lib/money";
import { HotelForm } from "@/components/vendor/hotel-form";
import type { HotelInput } from "@/lib/validators/listings";

export const metadata: Metadata = { title: "Edit hotel" };

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { rooms: { orderBy: { pricePerNight: "asc" } } },
  });
  if (!hotel || hotel.vendorId !== vendor.id) notFound();

  const initial: HotelInput = {
    name: hotel.name,
    propertyType: hotel.propertyType,
    description: hotel.description,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    altitudeMeters: hotel.altitudeMeters ?? undefined,
    amenities: hotel.amenities,
    freeCancellationDays: hotel.freeCancellationDays,
    coverImageUrl: hotel.coverImageUrl,
    imageUrls: hotel.imageUrls,
    rooms: hotel.rooms.map((r) => ({
      name: r.name,
      description: r.description ?? "",
      pricePerNight: paiseToRupees(r.pricePerNight),
      capacity: r.capacity,
      totalUnits: r.totalUnits,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">
        Edit hotel
      </h1>
      <HotelForm hotelId={hotel.id} initial={initial} />
    </div>
  );
}
