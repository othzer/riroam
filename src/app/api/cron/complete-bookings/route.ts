import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await prisma.booking.updateMany({
    where: { status: "CONFIRMED", endDate: { lt: new Date() } },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ ok: true, completed: result.count });
}
