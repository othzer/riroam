import Link from "next/link";
import type { Metadata } from "next";
import { VendorStatus } from "@prisma/client";
import { Clock, CheckCircle2, XCircle, Ban } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendor dashboard" };

export default async function VendorDashboardPage() {
  const { vendor } = await requireVendor();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-ink">
          {vendor.businessName}
        </h1>
        <p className="mt-1 text-ink-soft">Vendor dashboard</p>
      </div>

      <StatusBanner
        status={vendor.status}
        rejectionReason={vendor.rejectionReason}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <PlaceholderCard label="Active listings" />
        <PlaceholderCard label="Pending bookings" />
        <PlaceholderCard label="Avg rating" />
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Listings, bookings, and reviews arrive in the next phase.
      </p>
    </div>
  );
}

function StatusBanner({
  status,
  rejectionReason,
}: {
  status: VendorStatus;
  rejectionReason: string | null;
}) {
  const config = {
    PENDING_REVIEW: {
      icon: Clock,
      tone: "bg-sand-deep border-border text-ink",
      iconTone: "text-apricot-text",
      title: "Your application is under review",
      body: "Our team is verifying your business. You can draft listings now, but they can't be published until you're approved.",
    },
    APPROVED: {
      icon: CheckCircle2,
      tone: "bg-success-tint border-success/30 text-ink",
      iconTone: "text-success",
      title: "You're verified",
      body: "Your account is approved. You can publish listings and take bookings.",
    },
    REJECTED: {
      icon: XCircle,
      tone: "bg-danger-tint border-danger/30 text-ink",
      iconTone: "text-danger",
      title: "Application not approved",
      body: rejectionReason ?? "Your application was rejected.",
    },
    SUSPENDED: {
      icon: Ban,
      tone: "bg-danger-tint border-danger/30 text-ink",
      iconTone: "text-danger",
      title: "Account suspended",
      body: "Your listings are unpublished. Contact RiRoam support to resolve this.",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className={cn("rounded-card border px-5 py-4", config.tone)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", config.iconTone)} />
        <div>
          <p className="font-semibold">{config.title}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{config.body}</p>
          {status === "REJECTED" && (
            <Link
              href="/vendor/onboarding"
              className="mt-2 inline-block text-sm font-medium text-pangong hover:text-pangong-deep"
            >
              Update and resubmit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium text-ink">—</p>
    </div>
  );
}
