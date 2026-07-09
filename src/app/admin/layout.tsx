import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const metadata: Metadata = { title: "Admin" };

// Admin area — guarded here at the layout so every /admin/** page inherits the
// DB-checked admin gate. Plain, dense, functional; it's an internal tool.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <Logo />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
              <Link href="/admin" className="hover:text-ink">
                Dashboard
              </Link>
              <Link href="/admin/vendors" className="hover:text-ink">
                Vendors
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-chip bg-ink px-2 py-0.5 font-mono text-xs text-white">
              admin
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
