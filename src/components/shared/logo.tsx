import { cn } from "@/lib/utils";

/** Two-peak mountain silhouette in Pangong blue — the RiRoam mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-8", className)}
    >
      <path
        d="M1 22 L11 6 L16.5 14 L21 8 L31 22 Z"
        fill="var(--pangong)"
      />
      <path d="M11 6 L14 10.8 L11.4 14 L8.2 11.2 Z" fill="var(--surface)" />
    </svg>
  );
}

/** Full wordmark — mark + "RiRoam". */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
        RiRoam
      </span>
    </span>
  );
}
