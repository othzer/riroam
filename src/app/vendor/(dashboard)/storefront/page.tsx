import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { StorefrontForm } from "@/components/vendor/storefront-form";

export const metadata: Metadata = { title: "Storefront" };

export default async function StorefrontPage() {
  const { vendor } = await requireVendor();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Storefront</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Customise how your public storefront looks. Changes go live once you save.
      </p>

      <div className="mt-6">
        <StorefrontForm
          slug={vendor.slug}
          businessName={vendor.businessName}
          initial={{
            tagline: vendor.tagline ?? "",
            accentColor: vendor.accentColor ?? "",
            logoUrl: vendor.logoUrl ?? "",
            bannerUrl: vendor.bannerUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
