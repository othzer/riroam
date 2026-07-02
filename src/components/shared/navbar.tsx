import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { UserMenu } from "@/components/shared/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/packages", label: "Packages" },
  { href: "/hotels", label: "Stays" },
  { href: "/vehicles", label: "Rides" },
  { href: "/plan", label: "Plan a trip" },
];

// Session-aware — this is what was missing before: a signed-in user now sees
// their avatar/menu instead of a static "Sign in" link.
export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!session?.user && (
            <Link
              href="/vendor/onboarding"
              className="hidden text-[13px] font-semibold text-pangong transition-colors hover:text-pangong-deep sm:block"
            >
              List your business
            </Link>
          )}
          {session?.user ? (
            <UserMenu
              name={session.user.name ?? "Traveller"}
              email={session.user.email ?? ""}
              image={session.user.image}
              role={session.user.role}
            />
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
