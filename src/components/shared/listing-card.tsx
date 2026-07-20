import Link from "next/link";
import { formatINR } from "@/lib/money";
import { AltitudeChip } from "@/components/shared/altitude-chip";
import { RatingStars } from "@/components/shared/rating-stars";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { ListingImage, type ListingKind } from "@/components/shared/listing-image";

export type ListingCardData = {
  href: string;
  kind: ListingKind;
  image: string;
  imageAlt: string;
  title: string;
  routeLine: string;
  priceLabel: string; // "/person" | "/night" | "/day"
  priceAmount: number; // paise
  avgRating: number;
  reviewCount: number;
  vendorName: string;
  altitudeMeters?: number;
};

// Shared across packages/hotels/vehicles/explore/storefront/landing (design §5).
export function ListingCard({ data }: { data: ListingCardData }) {
  return (
    <Link
      href={data.href}
      className="group block overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-pangong/25 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand">
        {/* inner wrapper so the zoom scales the photo, not the chip */}
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
          <ListingImage
            src={data.image}
            alt={data.imageAlt}
            kind={data.kind}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
        {/* soft scrim keeps the photo's lower edge from flattening into the card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink/10 to-transparent" />
        {data.altitudeMeters !== undefined && (
          <AltitudeChip
            meters={data.altitudeMeters}
            onPhoto
            className="absolute left-2 top-2"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-heading text-[15px] font-bold text-ink">
          {data.title}
        </h3>
        <p className="mt-1 truncate text-xs text-ink-muted">{data.routeLine}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <RatingStars rating={data.avgRating} reviewCount={data.reviewCount} />
          <VerifiedBadge vendorName={data.vendorName} />
        </div>
        <div className="mt-3 border-t border-border-soft pt-3">
          <span className="font-mono text-[15px] font-bold text-ink">
            {formatINR(data.priceAmount)}
          </span>
          <span className="text-xs text-ink-muted"> {data.priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}
