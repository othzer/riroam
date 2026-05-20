import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl } = await searchParams;

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-center font-heading text-2xl font-bold text-ink">
        Welcome back
      </h1>
      <p className="mt-1 text-center text-sm text-ink-muted">
        Sign in to book and manage your trips
      </p>

      <div className="mt-6">
        <LoginForm callbackUrl={callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/register" className="font-medium text-pangong hover:text-pangong-deep">
          Create an account
        </Link>
      </p>
    </div>
  );
}
