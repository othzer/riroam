// Refund policy (§7.5). Pure and enum-free so it's safe to import into a
// client component — the cancel dialog previews the quote, the server
// recomputes it authoritatively in cancelBooking.

export type BookingStatusLite = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type RefundQuote = {
  canCancel: boolean;
  refundPercent: 0 | 50 | 100;
  refundAmount: number; // paise
  reason?: string; // why cancellation isn't allowed
};

/** Whole days from `now` (date-only, UTC) until `startDate`. */
export function daysUntil(startDate: Date, now = new Date()): number {
  const start = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((start - today) / 86_400_000);
}

export function computeRefund(params: {
  status: BookingStatusLite;
  isPaid: boolean;
  startDate: Date;
  freeCancellationDays: number;
  totalAmount: number; // paise
  now?: Date;
}): RefundQuote {
  const { status, isPaid, startDate, freeCancellationDays, totalAmount, now } = params;

  if (status !== "PENDING" && status !== "CONFIRMED") {
    return { canCancel: false, refundPercent: 0, refundAmount: 0, reason: "This booking can't be cancelled" };
  }

  const days = daysUntil(startDate, now);
  if (days <= 0) {
    return { canCancel: false, refundPercent: 0, refundAmount: 0, reason: "The trip has already started" };
  }

  const refundPercent = days >= freeCancellationDays ? 100 : 50;
  const refundAmount = isPaid ? Math.round((totalAmount * refundPercent) / 100) : 0;
  return { canCancel: true, refundPercent, refundAmount };
}
