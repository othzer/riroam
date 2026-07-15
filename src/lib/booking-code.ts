import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easier to read aloud

function randomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return out;
}

/** "RR-7F3K2M" — collision-checked against existing bookings. */
export async function generateBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `RR-${randomCode()}`;
    const existing = await prisma.booking.findUnique({
      where: { bookingCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique booking code");
}
