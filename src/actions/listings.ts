"use server";

import { revalidatePath } from "next/cache";
import { VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { rupeesToPaise } from "@/lib/money";
import {
  packageSchema,
  hotelSchema,
  vehicleSchema,
  type PackageInput,
  type HotelInput,
  type VehicleInput,
  type ListingType,
} from "@/lib/validators/listings";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type SimpleResult = { ok: true } | { ok: false; error: string };

function toUTCDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function invalid(parsed: { error: { flatten: () => { fieldErrors: Record<string, string[]> } } }): Result {
  return {
    ok: false,
    error: "Check the highlighted fields",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}

/** Thrown inside an update transaction to surface a friendly message. */
class ListingUpdateError extends Error {}

// ── Packages ────────────────────────────────────────────────────────────────
export async function createPackage(input: PackageInput): Promise<Result> {
  const { vendor } = await requireVendor();
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;

  const slug = await uniqueSlug(d.title, (s) =>
    prisma.package.findUnique({ where: { slug: s } }).then(Boolean),
  );
  const maxAltitudeMeters = Math.max(
    0,
    ...d.itineraryDays.map((x) => x.altitudeMeters),
  );

  const pkg = await prisma.package.create({
    data: {
      vendorId: vendor.id,
      title: d.title,
      slug,
      description: d.description,
      destinations: d.destinations,
      startCity: d.startCity,
      durationDays: d.durationDays,
      durationNights: d.durationNights,
      maxAltitudeMeters,
      pricePerPerson: rupeesToPaise(d.pricePerPerson),
      maxGroupSize: d.maxGroupSize,
      availableFrom: toUTCDate(d.availableFrom),
      availableTo: toUTCDate(d.availableTo),
      freeCancellationDays: d.freeCancellationDays,
      coverImageUrl: d.coverImageUrl,
      imageUrls: d.imageUrls,
      itineraryDays: {
        create: d.itineraryDays.map((day, i) => ({
          dayNumber: i + 1,
          title: day.title,
          location: day.location,
          altitudeMeters: day.altitudeMeters,
          description: day.description,
        })),
      },
      extras: {
        create: d.extras.map((e) => ({
          name: e.name,
          description: e.description || null,
          price: rupeesToPaise(e.price),
        })),
      },
    },
  });

  revalidatePath("/vendor/listings");
  return { ok: true, id: pkg.id };
}

export async function updatePackage(
  id: string,
  input: PackageInput,
): Promise<Result> {
  const { vendor } = await requireVendor();
  const existing = await prisma.package.findUnique({
    where: { id },
    select: { vendorId: true },
  });
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Listing not found" };
  }

  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;
  const maxAltitudeMeters = Math.max(
    0,
    ...d.itineraryDays.map((x) => x.altitudeMeters),
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id },
        data: {
          title: d.title,
          description: d.description,
          destinations: d.destinations,
          startCity: d.startCity,
          durationDays: d.durationDays,
          durationNights: d.durationNights,
          maxAltitudeMeters,
          pricePerPerson: rupeesToPaise(d.pricePerPerson),
          maxGroupSize: d.maxGroupSize,
          availableFrom: toUTCDate(d.availableFrom),
          availableTo: toUTCDate(d.availableTo),
          freeCancellationDays: d.freeCancellationDays,
          coverImageUrl: d.coverImageUrl,
          imageUrls: d.imageUrls,
          // Days carry no bookings — replacing them wholesale is safe.
          itineraryDays: {
            deleteMany: {},
            create: d.itineraryDays.map((day, i) => ({
              dayNumber: i + 1,
              title: day.title,
              location: day.location,
              altitudeMeters: day.altitudeMeters,
              description: day.description,
            })),
          },
        },
      });

      // Extras are upserted by id, never blindly replaced: existing bookings
      // hold BookingExtra rows pointing at these ids, and their snapshots must
      // keep their audit link while the extra lives. Removed extras are
      // deleted; SetNull severs the link and the snapshot remains the record.
      const existingExtras = await tx.extra.findMany({
        where: { packageId: id },
        select: { id: true },
      });
      const existingIds = new Set(existingExtras.map((e) => e.id));
      const keptIds = new Set<string>();

      for (const e of d.extras) {
        if (e.extraId && !existingIds.has(e.extraId)) {
          throw new ListingUpdateError("One of the extras no longer exists — reload and try again");
        }
        const data = {
          name: e.name,
          description: e.description || null,
          price: rupeesToPaise(e.price),
        };
        if (e.extraId) {
          keptIds.add(e.extraId);
          await tx.extra.update({ where: { id: e.extraId }, data });
        } else {
          await tx.extra.create({ data: { ...data, packageId: id } });
        }
      }

      const removed = existingExtras.filter((e) => !keptIds.has(e.id));
      if (removed.length > 0) {
        await tx.extra.deleteMany({ where: { id: { in: removed.map((e) => e.id) } } });
      }
    });
  } catch (e) {
    if (e instanceof ListingUpdateError) return { ok: false, error: e.message };
    throw e;
  }

  revalidatePath("/vendor/listings");
  return { ok: true, id };
}

// ── Hotels ──────────────────────────────────────────────────────────────────
export async function createHotel(input: HotelInput): Promise<Result> {
  const { vendor } = await requireVendor();
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;

  const slug = await uniqueSlug(d.name, (s) =>
    prisma.hotel.findUnique({ where: { slug: s } }).then(Boolean),
  );

  const hotel = await prisma.hotel.create({
    data: {
      vendorId: vendor.id,
      name: d.name,
      slug,
      propertyType: d.propertyType,
      description: d.description,
      address: d.address,
      city: d.city,
      state: d.state,
      altitudeMeters: d.altitudeMeters ?? null,
      amenities: d.amenities,
      freeCancellationDays: d.freeCancellationDays,
      coverImageUrl: d.coverImageUrl,
      imageUrls: d.imageUrls,
      rooms: {
        create: d.rooms.map((r) => ({
          name: r.name,
          description: r.description || null,
          pricePerNight: rupeesToPaise(r.pricePerNight),
          capacity: r.capacity,
          totalUnits: r.totalUnits,
        })),
      },
    },
  });

  revalidatePath("/vendor/listings");
  return { ok: true, id: hotel.id };
}

export async function updateHotel(
  id: string,
  input: HotelInput,
): Promise<Result> {
  const { vendor } = await requireVendor();
  const existing = await prisma.hotel.findUnique({
    where: { id },
    select: { vendorId: true },
  });
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Listing not found" };
  }

  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.hotel.update({
        where: { id },
        data: {
          name: d.name,
          propertyType: d.propertyType,
          description: d.description,
          address: d.address,
          city: d.city,
          state: d.state,
          altitudeMeters: d.altitudeMeters ?? null,
          amenities: d.amenities,
          freeCancellationDays: d.freeCancellationDays,
          coverImageUrl: d.coverImageUrl,
          imageUrls: d.imageUrls,
        },
      });

      // Rooms are upserted by id, never blindly replaced: bookings reference
      // their room row directly (availability, trip history), so deleting a
      // booked room would orphan them — Booking.roomId is SetNull, and a
      // nulled roomId silently stops counting against availability. A room
      // with bookings can be edited but not removed.
      const existingRooms = await tx.room.findMany({
        where: { hotelId: id },
        select: { id: true, name: true, _count: { select: { bookings: true } } },
      });
      const existingIds = new Set(existingRooms.map((r) => r.id));
      const keptIds = new Set<string>();

      for (const r of d.rooms) {
        if (r.roomId && !existingIds.has(r.roomId)) {
          throw new ListingUpdateError("One of the rooms no longer exists — reload and try again");
        }
        const data = {
          name: r.name,
          description: r.description || null,
          pricePerNight: rupeesToPaise(r.pricePerNight),
          capacity: r.capacity,
          totalUnits: r.totalUnits,
        };
        if (r.roomId) {
          keptIds.add(r.roomId);
          await tx.room.update({ where: { id: r.roomId }, data });
        } else {
          await tx.room.create({ data: { ...data, hotelId: id } });
        }
      }

      const removed = existingRooms.filter((r) => !keptIds.has(r.id));
      const blocked = removed.find((r) => r._count.bookings > 0);
      if (blocked) {
        throw new ListingUpdateError(
          `"${blocked.name}" has bookings and can't be removed — you can edit it or set its units to what's actually available`,
        );
      }
      if (removed.length > 0) {
        await tx.room.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
      }
    });
  } catch (e) {
    if (e instanceof ListingUpdateError) return { ok: false, error: e.message };
    throw e;
  }

  revalidatePath("/vendor/listings");
  return { ok: true, id };
}

// ── Vehicles ────────────────────────────────────────────────────────────────
export async function createVehicle(input: VehicleInput): Promise<Result> {
  const { vendor } = await requireVendor();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;

  const vehicle = await prisma.vehicleListing.create({
    data: {
      vendorId: vendor.id,
      vehicleType: d.vehicleType,
      title: d.title,
      brand: d.brand,
      model: d.model,
      city: d.city,
      state: d.state,
      pricePerDay: rupeesToPaise(d.pricePerDay),
      seats: d.seats ?? null,
      transmission: d.transmission || null,
      fuelType: d.fuelType || null,
      totalUnits: d.totalUnits,
      freeCancellationDays: d.freeCancellationDays,
      coverImageUrl: d.coverImageUrl,
      imageUrls: d.imageUrls,
    },
  });

  revalidatePath("/vendor/listings");
  return { ok: true, id: vehicle.id };
}

export async function updateVehicle(
  id: string,
  input: VehicleInput,
): Promise<Result> {
  const { vendor } = await requireVendor();
  const existing = await prisma.vehicleListing.findUnique({
    where: { id },
    select: { vendorId: true },
  });
  if (!existing || existing.vendorId !== vendor.id) {
    return { ok: false, error: "Listing not found" };
  }

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const d = parsed.data;

  await prisma.vehicleListing.update({
    where: { id },
    data: {
      vehicleType: d.vehicleType,
      title: d.title,
      brand: d.brand,
      model: d.model,
      city: d.city,
      state: d.state,
      pricePerDay: rupeesToPaise(d.pricePerDay),
      seats: d.seats ?? null,
      transmission: d.transmission || null,
      fuelType: d.fuelType || null,
      totalUnits: d.totalUnits,
      freeCancellationDays: d.freeCancellationDays,
      coverImageUrl: d.coverImageUrl,
      imageUrls: d.imageUrls,
    },
  });

  revalidatePath("/vendor/listings");
  return { ok: true, id };
}

// ── Delete + publish (shared across types) ──────────────────────────────────
export async function deleteListing(
  type: ListingType,
  id: string,
): Promise<SimpleResult> {
  const { vendor } = await requireVendor();
  const meta = await getMeta(type, id);
  if (!meta || meta.vendorId !== vendor.id) {
    return { ok: false, error: "Listing not found" };
  }

  // A listing with bookings (any status) is load-bearing: trips, reviews, and
  // refunds all reach back through it. Deleting would sever those FKs
  // (SetNull) and quietly corrupt history — unpublishing retires it instead.
  const bookingCount = await prisma.booking.count({
    where:
      type === "package"
        ? { packageId: id }
        : type === "hotel"
          ? { hotelId: id }
          : { vehicleId: id },
  });
  if (bookingCount > 0) {
    return {
      ok: false,
      error: "This listing has bookings and can't be deleted — unpublish it instead",
    };
  }

  if (type === "package") await prisma.package.delete({ where: { id } });
  else if (type === "hotel") await prisma.hotel.delete({ where: { id } });
  else await prisma.vehicleListing.delete({ where: { id } });

  revalidatePath("/vendor/listings");
  return { ok: true };
}

export async function togglePublish(
  type: ListingType,
  id: string,
): Promise<SimpleResult> {
  const { vendor } = await requireVendor();
  const meta = await getMeta(type, id);
  if (!meta || meta.vendorId !== vendor.id) {
    return { ok: false, error: "Listing not found" };
  }

  const next = !meta.isPublished;
  // Publish gating has real teeth here, not just in the UI (§3.3).
  if (next && vendor.status !== VendorStatus.APPROVED) {
    return { ok: false, error: "Your account must be approved to publish" };
  }

  if (type === "package")
    await prisma.package.update({ where: { id }, data: { isPublished: next } });
  else if (type === "hotel")
    await prisma.hotel.update({ where: { id }, data: { isPublished: next } });
  else
    await prisma.vehicleListing.update({
      where: { id },
      data: { isPublished: next },
    });

  revalidatePath("/vendor/listings");
  return { ok: true };
}

async function getMeta(type: ListingType, id: string) {
  if (type === "package")
    return prisma.package.findUnique({
      where: { id },
      select: { vendorId: true, isPublished: true },
    });
  if (type === "hotel")
    return prisma.hotel.findUnique({
      where: { id },
      select: { vendorId: true, isPublished: true },
    });
  return prisma.vehicleListing.findUnique({
    where: { id },
    select: { vendorId: true, isPublished: true },
  });
}
