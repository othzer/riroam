"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createReviewSchema, type CreateReviewInput } from "@/lib/validators/review";

type Result = { ok: true } | { ok: false; error: string };

/**
 * A review can only come from a COMPLETED booking owned by the caller
 * (`bookingId @unique` on Review makes "one review per booking" a schema-level
 * guarantee too). The listing's avgRating/reviewCount are recomputed in the
 * same transaction as the insert — denormalized so listing pages don't
 * aggregate on every render.
 */
export async function createReview(
  bookingId: string,
  input: CreateReviewInput,
): Promise<Result> {
  const session = await requireUser();
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }
  const { rating, title, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: { select: { id: true } } },
  });
  if (!booking || booking.touristId !== session.user.id) {
    return { ok: false, error: "Booking not found" };
  }
  if (booking.status !== "COMPLETED") {
    return { ok: false, error: "You can review a trip once it's completed" };
  }
  if (booking.review) {
    return { ok: false, error: "You've already reviewed this trip" };
  }

  const target = booking.packageId
    ? { packageId: booking.packageId }
    : booking.hotelId
      ? { hotelId: booking.hotelId }
      : booking.vehicleId
        ? { vehicleId: booking.vehicleId }
        : null;
  if (!target) return { ok: false, error: "This booking has no listing to review" };

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        bookingId: booking.id,
        touristId: session.user.id,
        vendorId: booking.vendorId,
        ...target,
        rating,
        title: title || null,
        comment,
      },
    });

    const agg = await tx.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: target,
    });
    const data = { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count };

    if (booking.packageId) {
      await tx.package.update({ where: { id: booking.packageId }, data });
    } else if (booking.hotelId) {
      await tx.hotel.update({ where: { id: booking.hotelId }, data });
    } else if (booking.vehicleId) {
      await tx.vehicleListing.update({ where: { id: booking.vehicleId }, data });
    }
  });

  revalidatePath("/trips");
  return { ok: true };
}
