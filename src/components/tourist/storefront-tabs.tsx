"use client";

import { useState } from "react";
import { ListingCard, type ListingCardData } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type Tab = { key: string; label: string; items: ListingCardData[] };

export function StorefrontTabs({ tabs }: { tabs: Tab[] }) {
  const nonEmpty = tabs.filter((t) => t.items.length > 0);
  const [active, setActive] = useState(nonEmpty[0]?.key ?? tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-5 flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors",
              t.key === current?.key ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {t.label} ({t.items.length})
            {t.key === current?.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-pangong" />
            )}
          </button>
        ))}
      </div>

      {current && current.items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {current.items.map((item) => (
            <ListingCard key={item.href} data={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here yet" body="This vendor hasn't published any listings in this category." />
      )}
    </div>
  );
}
