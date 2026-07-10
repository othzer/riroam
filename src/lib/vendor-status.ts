import { VendorStatus } from "@prisma/client";

// Vendor approval state machine (§3.3). Legal transitions live here so they're
// enforced in one place, not scattered across the admin actions.
const ALLOWED: Record<VendorStatus, VendorStatus[]> = {
  PENDING_REVIEW: [VendorStatus.APPROVED, VendorStatus.REJECTED],
  APPROVED: [VendorStatus.SUSPENDED],
  REJECTED: [VendorStatus.PENDING_REVIEW], // via re-apply (vendor action)
  SUSPENDED: [VendorStatus.APPROVED], // reinstate
};

export function canTransition(from: VendorStatus, to: VendorStatus): boolean {
  return ALLOWED[from].includes(to);
}
