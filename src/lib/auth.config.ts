import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe base config, shared by the full node config (lib/auth.ts) and the
 * middleware. It must NOT import Prisma or bcrypt — the middleware runs on the
 * edge runtime where those don't work. The Credentials provider and the
 * DB-touching jwt callback live in lib/auth.ts.
 */
export default {
  pages: {
    signIn: "/login",
  },
  providers: [Google],
  callbacks: {
    // Runs on every request (including middleware) to shape the session from
    // the decoded JWT — no DB access, so it's edge-safe.
    session({ session, token }) {
      if (session.user) {
        const userId =
          typeof token.userId === "string" ? token.userId : token.sub;
        if (userId) session.user.id = userId;
        if (typeof token.role === "string") {
          session.user.role = token.role as (typeof session.user)["role"];
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
