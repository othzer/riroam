import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-center font-heading text-2xl font-bold text-ink">
        Create your account
      </h1>
      <p className="mt-1 text-center text-sm text-ink-muted">
        Book trips, or list your business on RiRoam
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pangong hover:text-pangong-deep">
          Sign in
        </Link>
      </p>
    </div>
  );
}
