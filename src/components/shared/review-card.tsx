import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";

export type ReviewCardData = {
  id: string;
  touristName: string;
  rating: number;
  title?: string | null;
  comment: string;
  vendorReply?: string | null;
  vendorName?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Review card (design §5): initials avatar, name, "Verified trip" badge, star
// rating, comment; a vendor reply nests underneath with a left hairline.
export function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pangong-tint text-xs font-semibold text-pangong-deep">
          {initials(review.touristName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{review.touristName}</span>
            <span className="inline-flex items-center gap-1 rounded-chip bg-success-tint px-1.5 py-0.5 text-[11px] font-medium text-success">
              <BadgeCheck className="size-3" /> Verified trip
            </span>
          </div>
          <div className="mt-1">
            <RatingStars rating={review.rating} reviewCount={1} />
          </div>
          {review.title && (
            <p className="mt-1.5 text-sm font-semibold text-ink">{review.title}</p>
          )}
          <p className="mt-1 text-sm text-ink-soft">{review.comment}</p>

          {review.vendorReply && (
            <div className="mt-3 border-l-2 border-border pl-3">
              <p className="text-xs font-medium text-ink">
                {review.vendorName ?? "Vendor"} replied
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">{review.vendorReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
