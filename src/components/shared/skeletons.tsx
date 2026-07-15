// Layout-matching skeletons (design §7 — skeletons that mirror the final page,
// never spinners on page loads). Sand fills to stay on-brand.

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-sand ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="aspect-[16/10] w-full animate-pulse bg-sand" />
      <div className="space-y-2 p-4">
        <Block className="h-4 w-3/4" />
        <Block className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <Block className="h-3 w-16" />
          <Block className="h-3 w-20" />
        </div>
        <div className="border-t border-border-soft pt-3">
          <Block className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

/** A grid of listing-card skeletons — matches the explore-page layout. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Block className="mb-2 h-7 w-40" />
      <Block className="mb-6 h-4 w-28" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** A detail-page skeleton — gallery, content column, sticky booking card. */
export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Block className="mb-3 h-4 w-48" />
      <Block className="mb-1 h-8 w-2/3" />
      <Block className="mb-4 h-4 w-1/2" />
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <div className="aspect-[16/10] animate-pulse rounded-card bg-sand" />
        <div className="grid grid-rows-2 gap-2">
          <div className="animate-pulse rounded-card bg-sand" />
          <div className="animate-pulse rounded-card bg-sand" />
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-card bg-sand" />
          <div className="h-32 animate-pulse rounded-card bg-sand" />
        </div>
        <div className="h-80 animate-pulse rounded-card bg-sand" />
      </div>
    </div>
  );
}
