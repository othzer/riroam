import Link from "next/link";
import { Ridge } from "@/components/shared/ridge";
import { PrayerFlags } from "@/components/shared/prayer-flags";

export function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-6 w-40 opacity-70">
        <Ridge
          className="rounded-control"
          back="#E2DDD1"
          mid="#C9C2B2"
          front="#EFEAE0"
        />
      </div>
      <h3 className="font-heading text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{body}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          {ctaLabel}
        </Link>
      )}
      <PrayerFlags className="mt-6" />
    </div>
  );
}
