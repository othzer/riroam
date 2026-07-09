import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth.config";

// Edge-safe auth instance (no Prisma/bcrypt) — reads the JWT only.
const { auth } = NextAuth(authConfig);

// Coarse role gating (§3.4). This is a UX convenience, not the security
// boundary — every mutation and protected layout re-checks the DB via the
// require* helpers in lib/auth.ts.
export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // Paths that only require a logged-in user (ownership checked server-side).
  const requiresAuth =
    path === "/vendor/onboarding" ||
    path.startsWith("/vendor") ||
    path.startsWith("/admin") ||
    path.startsWith("/trips") ||
    path.startsWith("/checkout") ||
    path.startsWith("/plan");

  if (requiresAuth && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // /admin/** — ADMIN only.
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // /vendor/** (except onboarding, open to any logged-in user) — VENDOR only.
  if (
    path.startsWith("/vendor") &&
    path !== "/vendor/onboarding" &&
    role !== "VENDOR"
  ) {
    return NextResponse.redirect(new URL("/vendor/onboarding", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals, the auth API, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
