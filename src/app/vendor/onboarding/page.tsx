import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { VendorStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "List your business" };

export default async function VendorOnboardingPage() {
  const session = await requireUser();
  const existing = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, rejectionReason: true },
  });

  // Already applied and not rejected — nothing to do here.
  if (existing && existing.status !== VendorStatus.REJECTED) {
    redirect("/vendor/dashboard");
  }

  const isReapplying = existing?.status === VendorStatus.REJECTED;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-ink">
          List your business
        </h1>
        <p className="mt-2 text-ink-soft">
          Tell us about your business and upload one verification document. Our
          team reviews every application before your listings go live.
        </p>
      </div>

      {isReapplying && existing?.rejectionReason && (
        <div className="mb-6 rounded-control border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Previous application rejected:</span>{" "}
          {existing.rejectionReason}. Update your details and resubmit.
        </div>
      )}

      <OnboardingForm isReapplying={isReapplying} />
    </div>
  );
}
