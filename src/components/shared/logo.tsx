import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Two-peak mountain silhouette in Pangong blue — the RiRoam mark.
 *
 * The artwork lives in `public/logo-mark.svg` so the same file can be reused
 * outside React (email headers, share cards, anywhere a URL is needed). It's a
 * fixed brand colour rather than a themed one, so serving it as a static asset
 * costs nothing — a themed mark would have to stay inline, since CSS variables
 * don't reach into an SVG loaded through <img>.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      width={32}
      height={24}
      priority
      className={cn("h-6 w-8", className)}
    />
  );
}

/** Full wordmark — mark + "RiRoam". */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {/* Kept as live text, not baked into the SVG: it picks up the real
          webfont, stays selectable, and reads correctly to screen readers. */}
      <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
        RiRoam
      </span>
    </span>
  );
}
