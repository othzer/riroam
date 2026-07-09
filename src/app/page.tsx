import Link from "next/link";

// Placeholder landing — the real landing page is built in Phase 3.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="mb-4 inline-block rounded-chip border border-border bg-surface px-2.5 py-1 font-mono text-[13px] tracking-[0.03em] text-ink-soft">
          Leh · 3,524 m
        </p>
        <h1 className="text-balance font-heading text-5xl font-extrabold leading-[1.06] text-ink">
          Roam the land of <span className="text-pangong">high passes.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
          Verified stays, tours, and rides across Ladakh.{" "}
          <span className="font-mono">ri (རི)</span> — mountain, in Ladakhi.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/packages"
            className="rounded-control bg-apricot px-4 py-2.5 font-semibold text-ink transition-colors hover:bg-apricot-hover"
          >
            Explore circuits
          </Link>
          <Link
            href="/login"
            className="rounded-control px-4 py-2.5 font-medium text-pangong transition-colors hover:text-pangong-deep"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
