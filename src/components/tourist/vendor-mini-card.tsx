import Link from "next/link";
import { BadgeCheck } from "lucide-react";

// Vendor mini-card at the foot of every booking card: ink square with initials,
// verified business name, and a link to the public storefront.
export function VendorMiniCard({ name, slug }: { name: string; slug: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mt-3 flex items-center gap-2.5 border-t border-border-soft pt-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink font-mono text-[11px] font-bold text-white">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[12px] font-semibold text-ink">
          {name}
          <BadgeCheck className="size-3 text-pangong" />
        </p>
        <Link
          href={`/vendors/${slug}`}
          className="text-[11px] font-semibold text-pangong hover:text-pangong-deep"
        >
          View storefront
        </Link>
      </div>
    </div>
  );
}
