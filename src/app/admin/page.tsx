import Link from "next/link";
import { VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [pending, approved, totalVendors, totalUsers] = await Promise.all([
    prisma.vendorProfile.count({ where: { status: VendorStatus.PENDING_REVIEW } }),
    prisma.vendorProfile.count({ where: { status: VendorStatus.APPROVED } }),
    prisma.vendorProfile.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-heading text-2xl font-bold text-ink">Platform</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending approval" value={pending} highlight={pending > 0} />
        <Stat label="Approved vendors" value={approved} />
        <Stat label="Total vendors" value={totalVendors} />
        <Stat label="Users" value={totalUsers} />
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
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-3xl font-medium ${
          highlight ? "text-apricot-text" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
