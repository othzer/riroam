import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Ridge } from "@/components/shared/ridge";
import { PrayerFlags } from "@/components/shared/prayer-flags";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 w-44 opacity-70">
          <Ridge className="rounded-control" back="#E2DDD1" mid="#C9C2B2" front="#EFEAE0" />
        </div>
        <p className="font-mono text-sm tracking-wide text-ink-muted">404</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-ink">
          This trail doesn&apos;t exist
        </h1>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
          The page you were looking for may have moved or never existed. Head
          back and start from the map.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          Back to home
        </Link>
        <PrayerFlags className="mt-8" />
      </main>
    </div>
  );
}
