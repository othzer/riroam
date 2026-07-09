import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Role, VendorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";
import { loginSchema } from "@/lib/validators/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // On sign-in (or a forced session update), resolve the user BY EMAIL and
    // write the DB id + role into the token. Looking up by email — not by the
    // provider id — keeps the token id stable across Credentials/OAuth and
    // fixes the classic staleness bug where the token carried a provider id.
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        const email = user?.email ?? token.email;
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
          }
        }
      }
      return token;
    },
  },
});

/**
 * RBAC guards — the security boundary. Middleware (§3.4) is a UX convenience
 * that reads the JWT; these re-check the database on every protected action,
 * layout, and mutation. Never trust the token's role for anything that matters.
 */

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireVendor() {
  const session = await requireUser();
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (session.user.role !== Role.VENDOR || !vendor) redirect("/");
  return { session, vendor };
}

export async function requireApprovedVendor() {
  const { session, vendor } = await requireVendor();
  if (vendor.status !== VendorStatus.APPROVED) redirect("/vendor/dashboard");
  return { session, vendor };
}

export async function requireAdmin() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== Role.ADMIN) redirect("/");
  return session;
}
