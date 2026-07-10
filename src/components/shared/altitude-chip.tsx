import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

// Signature UI element — every package, hotel, and detail header carries one.
// "onPhoto" = dark ink pill for overlaying imagery; otherwise a bordered
// white pill.
export function AltitudeChip({
  label,
  meters,
  onPhoto = false,
  className,
}: {
  label?: string;
  meters: number;
  onPhoto?: boolean;
  className?: string;
}) {
  const text = label
    ? `${label} · ${meters.toLocaleString("en-IN")} m`
    : `max ${meters.toLocaleString("en-IN")} m`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip px-2 py-1 font-mono text-[13px] tracking-[0.03em]",
        onPhoto
          ? "bg-ink text-white"
          : "border border-border bg-surface text-ink-soft",
        className,
      )}
    >
      <Mountain className="size-3" />
      {text}
    </span>
  );
}
