import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await prisma.booking.updateMany({
    where: { status: "CONFIRMED", endDate: { lt: new Date() } },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ ok: true, completed: result.count });
}
