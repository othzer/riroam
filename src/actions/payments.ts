"use server";

import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/razorpay";
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
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return { ok: false, error: "Payments are not configured" };
  const rzp = new Razorpay({ key_id, key_secret });
  const remotePayment = await rzp.payments.fetch(razorpay_payment_id);
  if (Number(remotePayment.amount) !== booking.payment.amount) {
    return { ok: false, error: "Payment amount mismatch" };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: booking.payment.id },
      data: { status: "PAID", razorpayPaymentId: razorpay_payment_id, paidAt: new Date() },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    }),
  ]);

  await sendBookingConfirmedEmail(booking.tourist.email, {
    bookingCode: booking.bookingCode,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmount: booking.totalAmount,
  });
  await sendNewBookingReceivedEmail(booking.vendor.user.email, booking.vendor.user.name, booking.bookingCode);

  revalidatePath(`/checkout/${booking.id}`);
  revalidatePath(`/checkout/${booking.id}/result`);
  return { ok: true };
}
