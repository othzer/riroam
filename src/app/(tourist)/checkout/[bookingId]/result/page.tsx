import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { isExpired } from "@/lib/dates";

export const metadata: Metadata = { title: "Booking result" };

export default async function CheckoutResultPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireUser();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.touristId !== session.user.id) notFound();

  if (booking.status === "CONFIRMED") {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
          Your trip is booked
        </h1>
        <p className="mt-2 font-mono text-4xl font-bold tracking-wide text-ink">
          {booking.bookingCode}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {formatINR(booking.totalAmount)} paid. A confirmation email is on its way.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const canRetry = booking.status === "PENDING" && !isExpired(booking.expiresAt);

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <XCircle className="mx-auto size-10 text-danger" />
      <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
        {canRetry ? "Payment didn't go through" : "This hold has expired"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {canRetry
          ? "No amount was charged. You can try again before the hold expires."
          : "The reservation window closed. Head back to the listing to book again."}
      </p>
      {canRetry && (
        <Link
          href={`/checkout/${booking.id}`}
          className="mt-6 inline-block rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          Try again
        </Link>
      )}
    </div>
  );
}
