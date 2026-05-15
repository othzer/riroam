import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed skeleton (Phase 0). For now it creates the single admin account from
 * env — the admin is never self-registered (§3.3). The full demo dataset
 * (vendors, packages with itineraries, hotels, vehicles, bookings, reviews)
 * is filled in during Phase 7.
 */
async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      name: "RiRoam Admin",
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin: ${admin.email}`);

  // TODO (Phase 7): vendors (one per BusinessType, one PENDING_REVIEW),
  // ~6 packages with itineraries + extras, ~4 hotels with rooms, ~6 vehicles,
  // ~10 completed bookings with reviews, 2 upcoming confirmed bookings.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
