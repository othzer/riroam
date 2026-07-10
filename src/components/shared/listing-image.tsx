"use client";

import { useState } from "react";
import Image from "next/image";
import { Ridge } from "@/components/shared/ridge";

export type ListingKind = "package" | "hotel" | "vehicle";

// Per-type placeholder palette (design §10) — shown instead of a broken-image
// icon whenever a listing's image fails to load or is missing.
const PLACEHOLDER: Record<ListingKind, { bg: string; back: string; front: string }> = {
  package: { bg: "#CFE4EC", back: "#5E9FB5", front: "#0D6E8F" },
  hotel: { bg: "#F2E3C8", back: "#D9A94E", front: "#9C6210" },
  vehicle: { bg: "#E4D5CB", back: "#B07A5C", front: "#7A4A31" },
};

export function ListingImage({
  src,
  alt,
  kind,
  sizes,
  priority,
  className,
}: {
  src: string | undefined | null;
  alt: string;
  kind: ListingKind;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const palette = PLACEHOLDER[kind];

  if (!src || errored) {
    return (
      <div
        className={className ?? "absolute inset-0"}
        style={{ backgroundColor: palette.bg }}
      >
        <Ridge className="h-full" back={palette.bg} mid={palette.back} front={palette.front} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      onError={() => setErrored(true)}
    />
  );
}
