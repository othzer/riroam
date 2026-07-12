import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { VendorReviewReply } from "@/components/vendor/review-reply";

export const metadata: Metadata = { title: "Reviews" };

export default async function VendorReviewsPage() {
  const { vendor } = await requireVendor();

  const reviews = await prisma.review.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: {
      tourist: { select: { name: true } },
      booking: {
        select: {
          package: { select: { title: true } },
          hotel: { select: { name: true } },
          vehicle: { select: { title: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Reviews</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {reviews.length} review{reviews.length === 1 ? "" : "s"}
      </p>

      {reviews.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No reviews yet"
            body="Reviews from completed trips will appear here — reply to build trust."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{r.tourist.name}</p>
                  <p className="text-xs text-ink-muted">
                    {r.booking.package?.title ??
                      r.booking.hotel?.name ??
                      r.booking.vehicle?.title ??
                      "Listing"}
                  </p>
                </div>
                <RatingStars rating={r.rating} reviewCount={1} />
              </div>
              {r.title && <p className="mt-2 text-sm font-semibold text-ink">{r.title}</p>}
              <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
              <VendorReviewReply reviewId={r.id} existingReply={r.vendorReply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
