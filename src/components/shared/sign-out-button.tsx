"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className ?? "inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"}
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
