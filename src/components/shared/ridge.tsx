import { cn } from "@/lib/utils";

// Layered flat ridge silhouettes — back layer lightest, front darkest.
// Default palette is the hero set (§10). preserveAspectRatio="none" so it
// stretches to any width without distorting the flat fills.
type RidgeProps = {
  className?: string;
  back?: string;
  mid?: string;
  front?: string;
};

export function Ridge({
  className,
  back = "#BFDCE6",
  mid = "#5E9FB5",
  front = "#EFE7D6",
}: RidgeProps) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block w-full", className)}
    >
      <path d="M0 70 L60 34 L120 58 L190 22 L260 52 L330 30 L400 60 L400 120 L0 120 Z" fill={back} />
      <path d="M0 88 L70 58 L140 82 L210 50 L280 78 L350 56 L400 84 L400 120 L0 120 Z" fill={mid} />
      <path d="M0 104 L90 82 L160 100 L240 78 L300 98 L370 84 L400 100 L400 120 L0 120 Z" fill={front} />
    </svg>
  );
}
