import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/tourist/profile-form";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireUser();

  // Read the row rather than the JWT — the token can lag a just-saved edit.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">Profile</h1>

      <ProfileForm
        initialName={user.name}
        initialImage={user.image ?? ""}
        email={user.email}
      />

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <div>
          <p className="text-sm font-medium text-ink">Sign out</p>
          <p className="text-xs text-ink-muted">
            You&apos;ll need to sign in again to see your trips.
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
