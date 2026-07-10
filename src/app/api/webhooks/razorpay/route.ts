import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendBookingConfirmedEmail, sendNewBookingReceivedEmail } from "@/lib/mail";

// Independent second path to CONFIRMED — handles the user who pays and then
// closes the tab before the client callback (verifyPayment) runs. Both paths
// check current status first and no-op if already CONFIRMED (§7.4).
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const entity = event?.payload?.payment?.entity;
  if (!entity?.order_id) return NextResponse.json({ ok: true });

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: entity.order_id },
    include: {
      booking: {
        include: {
          tourist: { select: { email: true } },
          vendor: { select: { user: { select: { email: true, name: true } } } },
        },
      },
    },
  });
  if (!payment) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured") {
    if (payment.booking.status === "CONFIRMED") return NextResponse.json({ ok: true });
    if (Number(entity.amount) !== payment.amount) {
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }

    // Atomic guard — this webhook and the client-callback path (verifyPayment)
    // can race for the same booking; only whichever actually flips
    // PENDING -> CONFIRMED sends the notifications.
    const wonTransition = await prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: { id: payment.bookingId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (result.count === 0) return false;
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", razorpayPaymentId: entity.id, paidAt: new Date() },
      });
      return true;
    });

    if (wonTransition) {
      await sendBookingConfirmedEmail(payment.booking.tourist.email, {
        bookingCode: payment.booking.bookingCode,
        startDate: payment.booking.startDate,
        endDate: payment.booking.endDate,
        totalAmount: payment.booking.totalAmount,
      });
      await sendNewBookingReceivedEmail(
        payment.booking.vendor.user.email,
        payment.booking.vendor.user.name,
        payment.booking.bookingCode,
      );
    }
  } else if (event.event === "payment.failed") {
    if (payment.status === "CREATED") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
  }

  return NextResponse.json({ ok: true });
}
