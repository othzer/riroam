"use client";

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  vendorName,
  className,
}: {
  vendorName: string;
  className?: string;
}) {
  return (
    <span
      title="Verified by RiRoam admins"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-ink-soft",
        className,
      )}
    >
      <BadgeCheck className="size-3.5 text-pangong" />
      {vendorName}
    </span>
  );
}
