"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fetchRazorpayPayment, verifyPaymentSignature } from "@/lib/razorpay";
import { verifyPaymentSchema, type VerifyPaymentInput } from "@/lib/validators/booking";
import { sendBookingConfirmedEmail, sendNewBookingReceivedEmail } from "@/lib/mail";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Client-callback verification path. The webhook (route.ts) is the other,
 * independent path to the same outcome — both check current status first and
 * no-op if already CONFIRMED, so it's safe for both to run for the same
 * payment.
 */
export async function verifyPayment(input: VerifyPaymentInput): Promise<Result> {
  const session = await requireUser();
  const parsed = verifyPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment data" };
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      tourist: { select: { email: true, name: true } },
      vendor: { select: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!booking || booking.touristId !== session.user.id) {
    return { ok: false, error: "Booking not found" };
  }
  if (booking.status === "CONFIRMED") return { ok: true }; // idempotent
  if (!booking.payment || booking.payment.razorpayOrderId !== razorpay_order_id) {
    return { ok: false, error: "Payment does not match this booking" };
  }

  const validSignature = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );
  if (!validSignature) return { ok: false, error: "Payment verification failed" };

  // Never trust the client's amount — re-check against Razorpay's own record.
  // If this lookup fails transiently, don't fail the flow with a scary error:
  // the webhook is the independent second path to CONFIRMED (§7.4).
  let remoteAmount: number;
  try {
    const remotePayment = await fetchRazorpayPayment(razorpay_payment_id);
    remoteAmount = Number(remotePayment.amount);
  } catch (e) {
    console.error("verifyPayment: payment fetch failed:", e);
    return { ok: false, error: "Couldn't verify the payment yet — check My Trips in a moment" };
  }
  if (remoteAmount !== booking.payment.amount) {
    return { ok: false, error: "Payment amount mismatch" };
  }

  // Guard the PENDING -> CONFIRMED transition with an atomic updateMany so
  // this path and the webhook can't both "win" the same booking and send
  // duplicate emails — only the caller that actually flips the status
  // (count > 0) proceeds to mark the payment paid and notify.
  const payment = booking.payment;
  const wonTransition = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
    if (result.count === 0) return false;
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", razorpayPaymentId: razorpay_payment_id, paidAt: new Date() },
    });
    return true;
  });

  if (wonTransition) {
    await sendBookingConfirmedEmail(booking.tourist.email, {
      bookingCode: booking.bookingCode,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalAmount: booking.totalAmount,
    });
    await sendNewBookingReceivedEmail(booking.vendor.user.email, booking.vendor.user.name, booking.bookingCode);
  }

  revalidatePath(`/checkout/${booking.id}`);
  revalidatePath(`/checkout/${booking.id}/result`);
  return { ok: true };
}
