import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { PrayerFlags } from "@/components/shared/prayer-flags";
import { Ridge } from "@/components/shared/ridge";

export function Footer() {
  return (
    <footer className="bg-surface">
      {/* muted ridge as the divider — the footer sits behind the range */}
      <div aria-hidden className="h-10 w-full opacity-60">
        <Ridge className="h-full" back="#EFEAE0" mid="#E2DDD1" front="#FFFFFF" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-8">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          {/* brand column */}
          <div className="max-w-xs">
            <Logo />
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
              <PrayerFlags /> ri (རི) — mountain, in Ladakhi
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              A marketplace built for the high passes — every stay, ride and
              circuit here belongs to a verified Ladakhi business, and every
              booking keeps its earnings in the valley.
            </p>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 text-sm sm:grid-cols-4">
            <FooterCol
              title="Explore"
              links={[
                { href: "/packages", label: "Tour packages" },
                { href: "/hotels", label: "Stays & homestays" },
                { href: "/vehicles", label: "Taxis & bikes" },
                { href: "/search", label: "Search everything" },
              ]}
            />
            <FooterCol
              title="Plan"
              links={[
                { href: "/plan", label: "Plan with AI" },
                { href: "/packages?destination=Nubra", label: "Nubra valley" },
                { href: "/packages?destination=Pangong", label: "Pangong Tso" },
                { href: "/packages?destination=Zanskar", label: "Zanskar" },
              ]}
            />
            <FooterCol
              title="Travellers"
              links={[
                { href: "/trips", label: "My trips" },
                { href: "/profile", label: "Profile" },
                { href: "/login", label: "Sign in" },
                { href: "/register", label: "Create account" },
              ]}
            />
            <FooterCol
              title="Vendors"
              links={[
                { href: "/vendor/onboarding", label: "List your business" },
                { href: "/vendor/dashboard", label: "Vendor dashboard" },
                { href: "/vendor/storefront", label: "Your storefront" },
              ]}
            />
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border-soft pt-5 text-xs text-ink-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} RiRoam · Roam the land of high passes.</p>
          <p className="font-mono">Made at 3,524 m · Leh, Ladakh</p>
        </div>
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
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] text-ink-soft transition-colors hover:text-pangong"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
