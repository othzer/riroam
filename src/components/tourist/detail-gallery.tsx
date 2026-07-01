import { ListingImage, type ListingKind } from "@/components/shared/listing-image";

// Shared detail-page gallery: one large image (2fr) beside two stacked thumbs
// (1fr), with a "+N photos" overlay on the last tile. Every image slot falls
// back to a tinted ridge if the URL fails (design §8).
export function DetailGallery({
  images,
  alt,
  kind,
}: {
  images: string[];
  alt: string;
  kind: ListingKind;
}) {
  const gallery = images.slice(0, 3);
  const more = images.length - gallery.length;

  return (
    <div className="mt-4 grid h-56 grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
      <div className="relative overflow-hidden rounded-card bg-sand">
        <ListingImage
          src={gallery[0]}
          alt={alt}
          kind={kind}
          sizes="(min-width:640px) 66vw, 100vw"
          priority
        />
      </div>
      <div className="hidden grid-rows-2 gap-2 sm:grid">
        <div className="relative overflow-hidden rounded-card bg-sand">
          <ListingImage src={gallery[1] ?? gallery[0]} alt="" kind={kind} sizes="33vw" />
        </div>
        <div className="relative overflow-hidden rounded-card bg-sand">
          <ListingImage src={gallery[2] ?? gallery[0]} alt="" kind={kind} sizes="33vw" />
          {more > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-[12px] font-semibold text-white">
              + {more} photos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
