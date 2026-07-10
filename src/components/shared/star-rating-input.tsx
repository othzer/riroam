"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-pangong"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              n <= active ? "text-rating" : "text-border",
            )}
            fill={n <= active ? "currentColor" : "none"}
            strokeWidth={n <= active ? 0 : 1.5}
          />
        </button>
      ))}
    </div>
  );
}
