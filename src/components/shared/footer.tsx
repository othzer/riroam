import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { PrayerFlags } from "@/components/shared/prayer-flags";
import { Ridge } from "@/components/shared/ridge";
import { LinkedInIcon, GitHubIcon } from "@/components/shared/brand-icons";
import { SITE } from "@/lib/site";

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

        {/* contact row */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border-soft pt-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <ContactLink icon={LinkedInIcon} label="LinkedIn" href={SITE.linkedinUrl} />
            <ContactLink icon={GitHubIcon} label="GitHub" href={SITE.githubUrl} />
            <ContactLink
              icon={Mail}
              label="Contact us"
              href={SITE.contactEmail ? `mailto:${SITE.contactEmail}` : null}
            />
          </div>
          <p className="font-mono text-xs text-ink-muted">
            Made at 3,524 m · Leh, Ladakh
          </p>
        </div>

        {/* legal bar */}
        <div className="mt-5 flex flex-col items-start justify-between gap-1.5 text-xs text-ink-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} RiRoam. All rights reserved.
          </p>
          <p>
            A property of{" "}
            {SITE.ownerUrl ? (
              <a
                href={SITE.ownerUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-ink-soft transition-colors hover:text-pangong"
              >
                {SITE.owner}
              </a>
            ) : (
              <span className="font-medium text-ink-soft">{SITE.owner}</span>
            )}{" "}
            · Designed &amp; developed in Ladakh.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Renders as a real link once its env var is set, and as inert muted text
 * until then — a placeholder that reads as "not wired up yet" rather than as
 * a link that silently goes nowhere.
 */
function ContactLink({
  icon: Icon,
  label,
  href,
}: {
  // Widened from lucide's own type so the inlined brand glyphs fit too.
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string | null;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-xs font-medium transition-all duration-200";

  if (!href) {
    return (
      <span
        title={`${label} — coming soon`}
        aria-disabled="true"
        className={`${base} cursor-default border-border-soft text-ink-muted/70`}
      >
        <Icon className="size-3.5" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer"
      className={`${base} border-border text-ink-soft shadow-card hover:-translate-y-0.5 hover:border-pangong/30 hover:text-pangong hover:shadow-card-hover`}
    >
      <Icon className="size-3.5" />
      {label}
    </a>
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
