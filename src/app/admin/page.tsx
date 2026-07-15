import Link from "next/link";
import { VendorStatus, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";

export default async function AdminDashboardPage() {
  const [
    pending,
    approved,
    totalUsers,
    totalBookings,
    revenueAgg,
    pkgCount,
    hotelCount,
    vehicleCount,
  ] = await Promise.all([
    prisma.vendorProfile.count({ where: { status: VendorStatus.PENDING_REVIEW } }),
    prisma.vendorProfile.count({ where: { status: VendorStatus.APPROVED } }),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
    }),
    prisma.package.count({ where: { isPublished: true } }),
    prisma.hotel.count({ where: { isPublished: true } }),
    prisma.vehicleListing.count({ where: { isPublished: true } }),
  ]);

  const liveListings = pkgCount + hotelCount + vehicleCount;
  const gmv = revenueAgg._sum.totalAmount ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-heading text-2xl font-bold text-ink">Platform</h1>
      <p className="mt-1 text-sm text-ink-muted">
        An internal snapshot of the marketplace.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending approval" value={String(pending)} highlight={pending > 0} />
        <Stat label="Approved vendors" value={String(approved)} />
        <Stat label="Live listings" value={String(liveListings)} />
        <Stat label="Users" value={String(totalUsers)} />
        <Stat label="Total bookings" value={String(totalBookings)} />
        <Stat label="Gross bookings (test)" value={formatINR(gmv)} />
        <Stat label="Packages · stays · rides" value={`${pkgCount} · ${hotelCount} · ${vehicleCount}`} />
        <Stat label="Approval queue" value={pending > 0 ? "needs review" : "clear"} highlight={pending > 0} />
      </div>

      {pending > 0 && (
        <Link
          href="/admin/vendors"
          className="mt-6 inline-block rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          Review {pending} pending {pending === 1 ? "vendor" : "vendors"}
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-2xl font-medium ${
          highlight ? "text-apricot-text" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
