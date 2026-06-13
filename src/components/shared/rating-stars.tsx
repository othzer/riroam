import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  reviewCount,
  size = 14,
  className,
}: {
  rating: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}) {
  if (!reviewCount) {
    return (
      <span className={cn("text-xs text-ink-muted", className)}>
        No reviews yet
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-ink-soft", className)}>
      <Star
        className="text-rating"
        style={{ width: size, height: size }}
        fill="currentColor"
        strokeWidth={0}
      />
      <span className="font-medium text-ink">{rating.toFixed(1)}</span>
      <span className="text-ink-muted">
        ({reviewCount.toLocaleString("en-IN")})
      </span>
    </span>
  );
}
