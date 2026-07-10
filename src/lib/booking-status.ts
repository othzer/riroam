import { BookingStatus } from "@prisma/client";

// Booking status lifecycle (§7.1). Legal transitions enforced in one place.
//
//            create (holds inventory, expiresAt = +20min)
//                 │
//              PENDING ──payment verified──> CONFIRMED ──endDate passed (cron)──> COMPLETED
//                 │                              │
//   expiresAt passes / payment failed       tourist/vendor/admin cancels
//                 │                              │
//                 └──────> CANCELLED <───────────┘
const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from].includes(to);
}
