import type { ReactNode } from "react";
import { ReviewCard } from "@/components/shared/review-card";

// A white content card with an optional heading *inside* it — the section
// pattern used across every detail page (matches the mockup).
export function DetailCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-border bg-surface p-4 ${className ?? ""}`}>
      {title && (
        <h2 className="mb-2 font-heading text-[15px] font-bold text-ink">{title}</h2>
      )}
      {children}
    </div>
  );
}

type ReviewData = {
  id: string;
  touristName: string;
  rating: number;
  title: string | null;
  comment: string;
  vendorReply: string | null;
};

/** A "Reviews" card reused across package / hotel / vehicle detail pages. */
export function ReviewsCard({
  reviews,
  vendorName,
  emptyBody,
}: {
  reviews: ReviewData[];
  vendorName: string;
  emptyBody: string;
}) {
  return (
    <DetailCard title="Reviews">
      {reviews.length > 0 ? (
        <div className="divide-y divide-border-soft">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={{ ...r, vendorName }} />
          ))}
        </div>
      ) : (
        <p className="py-3 text-[12.5px] text-ink-muted">{emptyBody}</p>
      )}
    </DetailCard>
  );
}
