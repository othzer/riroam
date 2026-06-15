"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateBookingCode } from "@/lib/booking-code";
import { NoAvailabilityError, getBookedUnits } from "@/lib/availability";
import {
  computePackagePrice,
  computeRoomPrice,
  computeVehiclePrice,
  computeExtrasAmount,
  unitsBetween,
} from "@/lib/pricing";
import { createRazorpayOrder } from "@/lib/razorpay";
import {
  createBookingSchema,
  type CreateBookingInput,
} from "@/lib/validators/booking";

type Result = { ok: true; bookingId: string } | { ok: false; error: string };

const HOLD_MINUTES = 20;

function toUTCDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * The booking transaction (§7.3). Rooms/vehicles get a row lock + in-transaction
 * availability recheck (the race-condition fix — two users can't both win the
 * last unit); packages skip that since a package has no unit scarcity, per the
 * architecture's deliberate scoping (§2.4).
 */
export async function createBooking(input: CreateBookingInput): Promise<Result> {
  const session = await requireUser();
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking" };
  }
  const data = parsed.data;

  try {
    if (data.bookingType === "PACKAGE") {
      return await createPackageBooking(session.user.id, data);
    }
    if (data.bookingType === "HOTEL") {
      return await createHotelBooking(session.user.id, data);
    }
    return await createVehicleBooking(session.user.id, data);
  } catch (e) {
    if (e instanceof NoAvailabilityError) {
      return { ok: false, error: e.message };
    }
    console.error("createBooking failed:", e);
    return { ok: false, error: "Something went wrong — try again" };
  }
}

async function createPackageBooking(
  touristId: string,
  data: Extract<CreateBookingInput, { bookingType: "PACKAGE" }>,
): Promise<Result> {
  const pkg = await prisma.package.findUnique({
    where: { id: data.packageId, isPublished: true },
    include: { extras: true },
  });
  if (!pkg) return { ok: false, error: "This package is no longer available" };
  if (data.guestCount > pkg.maxGroupSize) {
    return { ok: false, error: `Max group size is ${pkg.maxGroupSize}` };
  }

  const startDate = toUTCDate(data.startDate);
  if (startDate < todayUTC() || startDate < pkg.availableFrom || startDate > pkg.availableTo) {
    return { ok: false, error: "Pick a start date within the available season" };
  }
  const endDate = addDays(startDate, pkg.durationDays);

  const selectedExtras = pkg.extras.filter((e) => data.extraIds.includes(e.id));
  const extrasSnapshot = selectedExtras.map((e) => ({
    extraId: e.id,
    nameSnapshot: e.name,
    priceSnapshot: e.price,
  }));
  const extrasAmount = computeExtrasAmount(
    extrasSnapshot.map((e) => ({ priceSnapshot: e.priceSnapshot })),
  );
  const { baseAmount, totalAmount } = computePackagePrice(
    pkg.pricePerPerson,
    data.guestCount,
    extrasAmount,
  );

  const bookingCode = await generateBookingCode();

  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      touristId,
      vendorId: pkg.vendorId,
      bookingType: "PACKAGE",
      packageId: pkg.id,
      startDate,
      endDate,
      guestCount: data.guestCount,
      unitCount: 1,
      baseAmount,
      extrasAmount,
      totalAmount,
      status: "PENDING",
      expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      bookingExtras: { create: extrasSnapshot },
    },
  });

  await attachRazorpayOrder(booking.id, booking.bookingCode, totalAmount);
  return { ok: true, bookingId: booking.id };
}

/**
 * Creates the Razorpay order and Payment row *after* the booking transaction
 * commits — an external network call must never run while a row lock
 * (SELECT ... FOR UPDATE) is held, since that holds up every other booking
 * for the same room/vehicle for the duration of the request. If this step
 * fails, the booking is left PENDING with no Payment; lazy expiry reclaims
 * its held inventory in 20 minutes with no special-case cleanup needed.
 */
async function attachRazorpayOrder(bookingId: string, bookingCode: string, amount: number) {
  const order = await createRazorpayOrder(amount, bookingCode);
  await prisma.payment.create({
    data: { bookingId, razorpayOrderId: order.id, amount, status: "CREATED" },
  });
}

async function createHotelBooking(
  touristId: string,
  data: Extract<CreateBookingInput, { bookingType: "HOTEL" }>,
): Promise<Result> {
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    include: { hotel: { select: { id: true, vendorId: true, isPublished: true } } },
  });
  if (!room || room.hotelId !== data.hotelId || !room.hotel.isPublished) {
    return { ok: false, error: "This room is no longer available" };
  }
  if (data.guestCount > room.capacity * data.unitCount) {
    return { ok: false, error: `This room sleeps ${room.capacity} per unit` };
  }

  const startDate = toUTCDate(data.startDate);
  const endDate = toUTCDate(data.endDate);
  const nights = unitsBetween(startDate, endDate);
  if (startDate < todayUTC() || nights < 1) {
    return { ok: false, error: "Pick a valid date range" };
  }

  const { baseAmount, totalAmount } = computeRoomPrice(
    room.pricePerNight,
    nights,
    data.unitCount,
  );
  const bookingCode = await generateBookingCode();

  const bookingId = await prisma.$transaction(
    async (tx) => {
      // Row lock — serializes concurrent bookings of the SAME room so two
      // users can't both win the last unit.
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${room.id} FOR UPDATE`;

      const booked = await getBookedUnits(tx, { roomId: room.id }, startDate, endDate);
      const available = room.totalUnits - booked;
      if (available < data.unitCount) throw new NoAvailabilityError(available);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          touristId,
          vendorId: room.hotel.vendorId,
          bookingType: "HOTEL",
          hotelId: room.hotel.id,
          roomId: room.id,
          startDate,
          endDate,
          guestCount: data.guestCount,
          unitCount: data.unitCount,
          baseAmount,
          extrasAmount: 0,
          totalAmount,
          status: "PENDING",
          expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
          contactName: data.contactName,
          contactPhone: data.contactPhone,
        },
      });

      return booking.id;
    },
    { timeout: 10_000 },
  );

  await attachRazorpayOrder(bookingId, bookingCode, totalAmount);
  return { ok: true, bookingId };
}

async function createVehicleBooking(
  touristId: string,
  data: Extract<CreateBookingInput, { bookingType: "VEHICLE" }>,
): Promise<Result> {
  const vehicle = await prisma.vehicleListing.findUnique({
    where: { id: data.vehicleId, isPublished: true },
  });
  if (!vehicle) return { ok: false, error: "This vehicle is no longer available" };
  if (vehicle.seats && data.guestCount > vehicle.seats * data.unitCount) {
    return { ok: false, error: `This vehicle seats ${vehicle.seats} per unit` };
  }

  const startDate = toUTCDate(data.startDate);
  const endDate = toUTCDate(data.endDate);
  const days = unitsBetween(startDate, endDate);
  if (startDate < todayUTC() || days < 1) {
    return { ok: false, error: "Pick a valid date range" };
  }

  const { baseAmount, totalAmount } = computeVehiclePrice(
    vehicle.pricePerDay,
    days,
    data.unitCount,
  );
  const bookingCode = await generateBookingCode();

  const bookingId = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "VehicleListing" WHERE id = ${vehicle.id} FOR UPDATE`;

      const booked = await getBookedUnits(tx, { vehicleId: vehicle.id }, startDate, endDate);
      const available = vehicle.totalUnits - booked;
      if (available < data.unitCount) throw new NoAvailabilityError(available);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          touristId,
          vendorId: vehicle.vendorId,
          bookingType: "VEHICLE",
          vehicleId: vehicle.id,
          startDate,
          endDate,
          guestCount: data.guestCount,
          unitCount: data.unitCount,
          baseAmount,
          extrasAmount: 0,
          totalAmount,
          status: "PENDING",
          expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
          contactName: data.contactName,
          contactPhone: data.contactPhone,
        },
      });

      return booking.id;
    },
    { timeout: 10_000 },
  );

  await attachRazorpayOrder(bookingId, bookingCode, totalAmount);
  return { ok: true, bookingId };
}
