"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, unstable_update } from "@/lib/auth";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";

type SimpleResult = { ok: true } | { ok: false; error: string };

/**
 * Display name + avatar. Email is deliberately not editable here: it's the key
 * the jwt callback resolves the user by, and changing it would need a
 * verification round-trip.
 */
export async function updateProfile(input: ProfileInput): Promise<SimpleResult> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const { name, image } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, image: image || null },
  });

  // The session is a JWT, so the DB write alone leaves the navbar showing the
  // old name and avatar until the next sign-in. This forces the token to be
  // rebuilt from the row we just wrote.
  await unstable_update({ user: { name, image: image || null } });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}
