import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { PrayerFlags } from "@/components/shared/prayer-flags";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <Logo />
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
              <PrayerFlags /> ri (རི) — mountain, in Ladakhi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <FooterCol
              title="Explore"
              links={[
                { href: "/packages", label: "Packages" },
                { href: "/hotels", label: "Stays" },
                { href: "/vehicles", label: "Rides" },
              ]}
            />
            <FooterCol
              title="RiRoam"
              links={[
                { href: "/vendor/onboarding", label: "List your business" },
                { href: "/search", label: "Search" },
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                { href: "/login", label: "Sign in" },
                { href: "/register", label: "Create account" },
              ]}
            />
          </div>
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          Roam the land of high passes.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-2 font-medium text-ink">{title}</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
