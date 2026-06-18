import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hygiene only — the lazy-expiry check in getBookedUnits() already ignores
// expired PENDING holds, so correctness never depends on this cron running.
// This just tidies up stale rows so they don't linger in dashboards/queries.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await prisma.booking.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "Payment hold expired" },
  });

  return NextResponse.json({ ok: true, cancelled: result.count });
}
