import Link from "next/link";
import { VerifiedBadge } from "@/components/shared/verified-badge";

export function VendorMiniCard({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-paper px-3 py-2.5">
      <VerifiedBadge vendorName={name} />
      <Link
        href={`/vendors/${slug}`}
        className="shrink-0 text-xs font-medium text-pangong hover:text-pangong-deep"
      >
        View storefront
      </Link>
    </div>
  );
}
