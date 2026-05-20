import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { SignOutButton } from "@/components/shared/sign-out-button";

// Light vendor chrome. Not a guard — /vendor/onboarding is open to any
// logged-in user, so each page enforces its own access with the require*
// helpers. The full dashboard sidebar arrives in Phase 2.
export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/vendor/dashboard">
            <Logo />
          </Link>
          <SignOutButton />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
