"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role, VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  requireVendor,
  requireApprovedVendor,
  unstable_update,
} from "@/lib/auth";
import { uniqueVendorSlug } from "@/lib/slug";
import {
  onboardingSchema,
  storefrontSchema,
  type OnboardingInput,
  type StorefrontInput,
} from "@/lib/validators/vendor";
import { replyReviewSchema } from "@/lib/validators/review";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type SimpleResult = { ok: true } | { ok: false; error: string };

/**
 * Storefront lite-customization — logo, banner, accent colour, tagline.
 * APPROVED vendors only; empty strings clear the field back to null.
 */
export async function updateStorefront(
  input: StorefrontInput,
): Promise<SimpleResult> {
  const { vendor } = await requireApprovedVendor();
  const parsed = storefrontSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const d = parsed.data;

  await prisma.vendorProfile.update({
    where: { id: vendor.id },
    data: {
      tagline: d.tagline || null,
      accentColor: d.accentColor || null,
      logoUrl: d.logoUrl || null,
      bannerUrl: d.bannerUrl || null,
    },
  });

  revalidatePath("/vendor/storefront");
  revalidatePath(`/vendors/${vendor.slug}`);
  return { ok: true };
}

/** Vendor replies to a review on one of their own listings. */
export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<SimpleResult> {
  const { vendor } = await requireVendor();
  const parsed = replyReviewSchema.safeParse({ reply });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply" };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { vendorId: true },
  });
  if (!review || review.vendorId !== vendor.id) {
    return { ok: false, error: "Review not found" };
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { vendorReply: parsed.data.reply, repliedAt: new Date() },
  });

  revalidatePath("/vendor/reviews");
  return { ok: true };
}

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
    district: data.district,
    region: data.region,
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
    // uniqueVendorSlug's check isn't atomic, so two concurrent onboardings with
    // the same business name could pick the same slug. The DB @unique constraint
    // still protects us; on a slug collision (P2002) we regenerate and retry.
    for (let attempt = 0; ; attempt++) {
      const slug = await uniqueVendorSlug(data.businessName);
      try {
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
        break;
      } catch (e) {
        const target =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
            ? e.meta?.target
            : undefined;
        const isSlugCollision = Array.isArray(target)
          ? target.includes("slug")
          : String(target ?? "").includes("slug");
        if (isSlugCollision && attempt < 3) continue;
        throw e;
      }
    }
  }

  // Refresh the token so role=VENDOR is reflected immediately.
  await unstable_update({});
  revalidatePath("/vendor/dashboard");
  return { ok: true };
}
