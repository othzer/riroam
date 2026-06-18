import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export class NoAvailabilityError extends Error {
  constructor(public available: number) {
    super(
      available > 0
        ? `Only ${available} left for these dates`
        : "Nothing available for these dates",
    );
    this.name = "NoAvailabilityError";
  }
}

/**
 * Units already committed against a room or vehicle for a date range.
 *
 * Two ranges [aStart,aEnd) and [bStart,bEnd) overlap iff aStart < bEnd AND
 * aEnd > bStart. A live PENDING hold (expiresAt still in the future) counts
 * as booked; an expired one doesn't — that's lazy expiry: an abandoned
 * checkout releases its inventory the moment `expiresAt` passes, with no
 * cron needing to run for correctness. The cron (§7.6) is hygiene only.
 */
export async function getBookedUnits(
  tx: Tx,
  target: { roomId: string } | { vehicleId: string },
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const agg = await tx.booking.aggregate({
    _sum: { unitCount: true },
    where: {
      ...target,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", expiresAt: { gt: new Date() } },
      ],
    },
  });
  return agg._sum.unitCount ?? 0;
}

export async function getAvailableUnits(
  tx: Tx,
  target: { roomId: string; totalUnits: number } | { vehicleId: string; totalUnits: number },
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const key = "roomId" in target ? { roomId: target.roomId } : { vehicleId: target.vehicleId };
  const booked = await getBookedUnits(tx, key, startDate, endDate);
  return target.totalUnits - booked;
}
