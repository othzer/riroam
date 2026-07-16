import Link from "next/link";
import type { ReactNode } from "react";
import { AltitudeChip } from "@/components/shared/altitude-chip";

// Shared detail-page header: breadcrumb, title, a one-line meta row, and an
// optional altitude chip pinned top-right — the treatment used on every
// listing detail page (matches the design mockup).
export function DetailHeader({
  breadcrumb,
  title,
  meta,
  altitudeMeters,
}: {
  breadcrumb: { label: string; href: string };
  title: string;
  meta: ReactNode[];
  altitudeMeters?: number | null;
}) {
  return (
    <>
      <nav className="text-[11.5px] text-ink-muted">
        <Link href={breadcrumb.href} className="hover:text-ink">
          {breadcrumb.label}
        </Link>{" "}
        / <span className="text-ink-soft">{title}</span>
      </nav>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-extrabold text-ink">{title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
            {meta.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 && <span className="text-ink-muted">·</span>}
                <span className="inline-flex items-center gap-1">{m}</span>
              </span>
            ))}
          </div>
        </div>
        {altitudeMeters != null && (
          <AltitudeChip meters={altitudeMeters} className="shrink-0" />
        )}
      </div>
    </>
  );
}
