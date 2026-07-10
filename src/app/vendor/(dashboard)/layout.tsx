import Link from "next/link";
import { requireVendor } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { SidebarNav } from "@/components/vendor/sidebar-nav";

// Guarded vendor dashboard shell (sidebar). Onboarding lives outside this group
// so a not-yet-approved user can still complete it.
export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVendor();

  return (
    <div className="flex flex-1">
      {/* desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="p-4">
          <Link href="/vendor/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 px-3 py-2">
          <SidebarNav />
        </div>
        <div className="border-t border-border p-4">
          <SignOutButton />
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <Link href="/vendor/dashboard">
            <Logo />
          </Link>
          <SignOutButton />
        </header>
        <div className="md:hidden">
          <div className="border-b border-border bg-surface px-3 py-2">
            <SidebarNav />
          </div>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
