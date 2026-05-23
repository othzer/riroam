"use server";

import { revalidatePath } from "next/cache";
import { VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { canTransition } from "@/lib/vendor-status";
import { rejectVendorSchema } from "@/lib/validators/admin";
import {
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
} from "@/lib/mail";

type ActionResult = { ok: true } | { ok: false; error: string };

function loadVendor(id: string) {
  return prisma.vendorProfile.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
}

export async function approveVendor(id: string): Promise<ActionResult> {
  await requireAdmin();
  const vendor = await loadVendor(id);
  if (!vendor) return { ok: false, error: "Vendor not found" };
  if (!canTransition(vendor.status, VendorStatus.APPROVED)) {
    return { ok: false, error: `Can't approve a ${vendor.status} vendor` };
  }

  await prisma.vendorProfile.update({
    where: { id },
    data: {
      status: VendorStatus.APPROVED,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  try {
    await sendVendorApprovedEmail(vendor.user.email, vendor.user.name);
  } catch (e) {
    console.error("approveVendor: failed to send email:", e);
  }
  revalidateAdmin();
  return { ok: true };
}

export async function rejectVendor(
  id: string,
  reason: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = rejectVendorSchema.safeParse({ reason });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const vendor = await loadVendor(id);
  if (!vendor) return { ok: false, error: "Vendor not found" };
  if (!canTransition(vendor.status, VendorStatus.REJECTED)) {
    return { ok: false, error: `Can't reject a ${vendor.status} vendor` };
  }

  await prisma.vendorProfile.update({
    where: { id },
    data: {
      status: VendorStatus.REJECTED,
      rejectionReason: parsed.data.reason,
    },
  });

  await sendVendorRejectedEmail(
    vendor.user.email,
    vendor.user.name,
    parsed.data.reason,
  );
  revalidateAdmin();
  return { ok: true };
}

export async function suspendVendor(id: string): Promise<ActionResult> {
  await requireAdmin();
  const vendor = await loadVendor(id);
  if (!vendor) return { ok: false, error: "Vendor not found" };
  if (!canTransition(vendor.status, VendorStatus.SUSPENDED)) {
    return { ok: false, error: `Can't suspend a ${vendor.status} vendor` };
  }

  // Suspension auto-unpublishes every listing the vendor owns.
  await prisma.$transaction([
    prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.SUSPENDED },
    }),
    prisma.package.updateMany({
      where: { vendorId: id },
      data: { isPublished: false },
    }),
    prisma.hotel.updateMany({
      where: { vendorId: id },
      data: { isPublished: false },
    }),
    prisma.vehicleListing.updateMany({
      where: { vendorId: id },
      data: { isPublished: false },
    }),
  ]);

  revalidateAdmin();
  return { ok: true };
}
