"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Create a TOURIST account from the register form (email + bcrypt password). */
export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: { name, email, passwordHash },
    });
  } catch (e) {
    // Two concurrent registrations can both pass the check above; the @unique
    // constraint is the real guard — turn its violation into the same error.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "An account with this email already exists" };
    }
    throw e;
  }

  return { ok: true };
}
