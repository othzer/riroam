"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { updateStorefront } from "@/actions/vendor";
import { storefrontSchema } from "@/lib/validators/vendor";
import { SingleImageUpload } from "@/components/shared/image-upload";
import { FormCard, FieldError } from "@/components/vendor/form-parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function StorefrontForm({
  slug,
  businessName,
  initial,
}: {
  slug: string;
  businessName: string;
  initial: {
    tagline: string;
    accentColor: string;
    logoUrl: string;
    bannerUrl: string;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagline, setTagline] = useState(initial.tagline);
  // Stays "" until the vendor actually picks a colour — an unset accent must
  // not be silently coerced into a real value and saved on an unrelated edit.
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);

  // <input type="color"> can't display "" — this is a render-only fallback,
  // never written back into accentColor.
  const displayColor = accentColor || "#0D6E8F";

  async function onSubmit() {
    setError(null);
    const input = { tagline, accentColor, logoUrl, bannerUrl };
    const parsed = storefrontSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setPending(true);
    try {
      const res = await updateStorefront(parsed.data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Storefront saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {/* live preview banner — accent tints the banner only, per design §6 */}
      <div className="overflow-hidden rounded-card border border-border">
        <div
          className="relative h-28"
          style={{ backgroundColor: accentColor ? `${accentColor}22` : "var(--sand)" }}
        >
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-center gap-3 bg-surface p-4">
          <div className="-mt-10 flex size-14 items-center justify-center overflow-hidden rounded-xl border-4 border-paper bg-surface">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-heading text-lg font-bold text-pangong">
                {businessName[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-heading text-base font-bold text-ink">{businessName}</p>
            {tagline && (
              <p
                className="inline-block border-b-2 text-xs text-ink-soft"
                style={{ borderColor: displayColor }}
              >
                {tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      <FormCard title="Branding">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <SingleImageUpload
              folder="logos"
              value={logoUrl || undefined}
              onChange={(url) => setLogoUrl(url ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Banner</Label>
            <SingleImageUpload
              folder="banners"
              value={bannerUrl || undefined}
              onChange={(url) => setBannerUrl(url ?? "")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="Small-group Ladakh circuits, run by locals."
            maxLength={120}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="accent">Accent colour</Label>
          <div className="flex items-center gap-3">
            <input
              id="accent"
              type="color"
              value={displayColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="size-9 shrink-0 cursor-pointer rounded-control border border-border bg-surface"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="max-w-32 font-mono"
            />
            <span className="text-xs text-ink-muted">
              Tints your banner and small accents only — never buttons.
            </span>
          </div>
        </div>

        {error && <FieldError msg={error} />}
      </FormCard>

      <div className="flex items-center justify-between">
        <Link
          href={`/vendors/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pangong hover:text-pangong-deep"
        >
          View public storefront <ExternalLink className="size-3.5" />
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save storefront
        </Button>
      </div>
    </form>
  );
}
