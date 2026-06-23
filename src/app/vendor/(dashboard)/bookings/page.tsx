import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { BookingStatusPill } from "@/components/shared/booking-status-pill";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Bookings" };

export default async function VendorBookingsPage() {
  const { vendor } = await requireVendor();

  const bookings = await prisma.booking.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: {
      tourist: { select: { name: true } },
      package: { select: { title: true } },
      hotel: { select: { name: true } },
      vehicle: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Bookings</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"}
      </p>

      {bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No bookings yet"
            body="Once travellers book your published listings, they'll appear here."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-border">
          <table className="w-full text-sm">
            <thead className="bg-sand text-left text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Traveller</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-surface">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">{b.bookingCode}</td>
                  <td className="px-4 py-3 text-ink">
                    {b.package?.title ?? b.hotel?.name ?? b.vehicle?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{b.tourist.name}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDateRange(b.startDate, b.endDate)}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{b.guestCount}</td>
                  <td className="px-4 py-3">
                    <BookingStatusPill status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {formatINR(b.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
