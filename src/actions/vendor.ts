"use server";

import { revalidatePath } from "next/cache";
import { Role, VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, unstable_update } from "@/lib/auth";
import { uniqueVendorSlug } from "@/lib/slug";
import { onboardingSchema, type OnboardingInput } from "@/lib/validators/vendor";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Turn a TOURIST into a VENDOR (status PENDING_REVIEW), or let a REJECTED
 * vendor re-apply. Sets role VENDOR and refreshes the JWT so the proxy lets
 * them into the vendor area without a re-login (§3.2).
 */
export async function submitVendorOnboarding(
  input: OnboardingInput,
): Promise<ActionResult> {
  const session = await requireUser();
  const userId = session.user.id;

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  const fields = {
    businessName: data.businessName,
    businessType: data.businessType,
    description: data.description || null,
    phone: data.phone,
    city: data.city,
    state: data.state,
    serviceAreas: data.serviceAreas,
    gstNumber: data.gstNumber || null,
    verificationDocUrl: data.verificationDocUrl,
  };

  if (existing) {
    // Only a rejected application can be resubmitted.
    if (existing.status !== VendorStatus.REJECTED) {
      return { ok: false, error: "You already have a vendor profile" };
    }
    await prisma.vendorProfile.update({
      where: { id: existing.id },
      data: {
        ...fields,
        status: VendorStatus.PENDING_REVIEW,
        rejectionReason: null,
      },
    });
  } else {
    const slug = await uniqueVendorSlug(data.businessName);
    await prisma.$transaction([
      prisma.vendorProfile.create({
        data: {
          userId,
          slug,
          status: VendorStatus.PENDING_REVIEW,
          ...fields,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: Role.VENDOR },
      }),
    ]);
  }

  // Refresh the token so role=VENDOR is reflected immediately.
  await unstable_update({});
  revalidatePath("/vendor/dashboard");
  return { ok: true };
}
