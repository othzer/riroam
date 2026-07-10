import { cn } from "@/lib/utils";

// Prayer-flag thread — five dashes in the flag colors. Used in exactly two
// places: the footer beside the wordmark, and 404/empty-state illustrations.
const FLAG_COLORS = [
  "var(--flag-blue)",
  "var(--flag-white)",
  "var(--flag-red)",
  "var(--flag-green)",
  "var(--flag-yellow)",
];

export function PrayerFlags({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden="true"
    >
      {FLAG_COLORS.map((color, i) => (
        <span
          key={i}
          className="inline-block h-[3px] w-3 rounded-full"
          style={{
            backgroundColor: color,
            outline:
              color === "var(--flag-white)"
                ? "1px solid var(--border)"
                : undefined,
          }}
        />
      ))}
    </span>
  );
}
