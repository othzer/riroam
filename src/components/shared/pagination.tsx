import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      <PageLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </PageLink>
      <span className="px-3 font-mono text-sm text-ink-soft">
        {page} / {totalPages}
      </span>
      <PageLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span className="flex size-8 items-center justify-center rounded-control border border-border text-ink-muted opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "flex size-8 items-center justify-center rounded-control border border-border text-ink-soft transition-colors hover:border-pangong hover:text-pangong",
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
