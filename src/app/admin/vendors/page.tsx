import type { Metadata } from "next";
import { VendorStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BUSINESS_TYPE_LABELS } from "@/lib/validators/vendor";
import { VendorActions } from "@/components/admin/vendor-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendors" };

const STATUS_ORDER: Record<VendorStatus, number> = {
  PENDING_REVIEW: 0,
  APPROVED: 1,
  SUSPENDED: 2,
  REJECTED: 3,
};

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendorProfile.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  vendors.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-heading text-2xl font-bold text-ink">Vendors</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {vendors.length} total · approval queue
      </p>

      <div className="mt-6 overflow-hidden rounded-card border border-border">
        <table className="w-full text-sm">
          <thead className="bg-sand text-left text-xs text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Doc</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft bg-surface">
            {vendors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                  No vendor applications yet.
                </td>
              </tr>
            )}
            {vendors.map((v) => (
              <tr key={v.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold text-ink">{v.businessName}</p>
                  <p className="text-xs text-ink-muted">
                    {BUSINESS_TYPE_LABELS[v.businessType]}
                  </p>
                  {v.serviceAreas.length > 0 && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Serves: {v.serviceAreas.join(", ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="text-ink">{v.user.name}</p>
                  <p className="text-xs text-ink-muted">{v.user.email}</p>
                  <p className="text-xs text-ink-muted">{v.phone}</p>
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {v.city}, {v.state}
                </td>
                <td className="px-4 py-4">
                  <a
                    href={v.verificationDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-pangong hover:underline"
                  >
                    View <ExternalLink className="size-3" />
                  </a>
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={v.status} />
                  {v.status === "REJECTED" && v.rejectionReason && (
                    <p className="mt-1 max-w-[16rem] text-xs text-ink-muted">
                      {v.rejectionReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <VendorActions vendorId={v.id} status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: VendorStatus }) {
  const styles: Record<VendorStatus, string> = {
    PENDING_REVIEW: "bg-sand text-ink-soft",
    APPROVED: "bg-pangong-tint text-pangong-deep",
    REJECTED: "bg-danger-tint text-danger",
    SUSPENDED: "bg-danger-tint text-danger",
  };
  const labels: Record<VendorStatus, string> = {
    PENDING_REVIEW: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-chip px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
