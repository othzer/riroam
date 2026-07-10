import Link from "next/link";
import { X } from "lucide-react";
import type { SearchParams } from "@/lib/filters";

const RATINGS = [
  { value: "4.5", label: "4.5+" },
  { value: "4", label: "4+" },
  { value: "3", label: "3+" },
];

type Variant = "packages" | "hotels" | "vehicles";

const FILTER_LABELS: Record<string, (v: string) => string> = {
  destination: (v) => `"${v}"`,
  budgetMin: (v) => `Min ₹${v}`,
  budgetMax: (v) => `Max ₹${v}`,
  duration: (v) => `≤ ${v} days`,
  propertyType: (v) => (v === "HOTEL" ? "Hotels" : "Homestays"),
  type: (v) => (v === "TAXI" ? "Taxis" : "Bikes"),
  rating: (v) => `${v}+ stars`,
};

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

// URL-driven — a plain GET form, zero client JS. Active filters render as
// dismissible chips (plain links removing that one param). "Clear all"
// appears once 2+ filters are active (§ design 5).
export function FilterBar({
  basePath,
  variant,
  searchParams: sp,
}: {
  basePath: string;
  variant: Variant;
  searchParams: SearchParams;
}) {
  const active = Object.entries(sp).filter(
    ([k, v]) => k !== "page" && v !== undefined && v !== "",
  ) as [string, string][];

  return (
    <div className="mb-6">
      <form
        action={basePath}
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-3"
      >
        <Field label="Destination">
          <input
            name="destination"
            defaultValue={first(sp.destination) ?? ""}
            placeholder="City or region"
            className="w-40 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </Field>

        <Field label="Budget min (₹)">
          <input
            name="budgetMin"
            type="number"
            min={0}
            defaultValue={first(sp.budgetMin) ?? ""}
            className="w-24 bg-transparent text-sm text-ink outline-none"
          />
        </Field>
        <Field label="Budget max (₹)">
          <input
            name="budgetMax"
            type="number"
            min={0}
            defaultValue={first(sp.budgetMax) ?? ""}
            className="w-24 bg-transparent text-sm text-ink outline-none"
          />
        </Field>

        {variant === "packages" && (
          <Field label="Duration">
            <select
              name="duration"
              defaultValue={first(sp.duration) ?? ""}
              className="bg-transparent text-sm text-ink outline-none"
            >
              <option value="">Any</option>
              <option value="3">Up to 3 days</option>
              <option value="5">Up to 5 days</option>
              <option value="7">Up to 7 days</option>
              <option value="14">Up to 14 days</option>
            </select>
          </Field>
        )}

        {variant === "hotels" && (
          <Field label="Type">
            <select
              name="propertyType"
              defaultValue={first(sp.propertyType) ?? ""}
              className="bg-transparent text-sm text-ink outline-none"
            >
              <option value="">Any</option>
              <option value="HOTEL">Hotel</option>
              <option value="HOMESTAY">Homestay</option>
            </select>
          </Field>
        )}

        {variant === "vehicles" && (
          <Field label="Type">
            <div className="inline-flex rounded-control border border-border p-0.5">
              {[
                { value: "", label: "Both" },
                { value: "TAXI", label: "Taxi" },
                { value: "BIKE", label: "Bike" },
              ].map((opt) => {
                const isActive = (first(sp.type) ?? "") === opt.value;
                return (
                  <button
                    key={opt.value || "both"}
                    type="submit"
                    name="type"
                    value={opt.value}
                    className={`rounded-[6px] px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-pangong-tint text-pangong-deep"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Rating">
          <select
            name="rating"
            defaultValue={first(sp.rating) ?? ""}
            className="bg-transparent text-sm text-ink outline-none"
          >
            <option value="">Any</option>
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="ml-auto rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
        >
          Apply
        </button>
      </form>

      {active.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active.map(([key, value]) => {
            const rest = new URLSearchParams();
            for (const [k, v] of Object.entries(sp)) {
              if (k === key || k === "page" || v === undefined) continue;
              for (const val of Array.isArray(v) ? v : [v]) rest.append(k, val);
            }
            const qs = rest.toString();
            return (
              <Link
                key={key}
                href={qs ? `${basePath}?${qs}` : basePath}
                className="inline-flex items-center gap-1 rounded-chip bg-sand px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-sand-deep"
              >
                {FILTER_LABELS[key]?.(value) ?? value}
                <X className="size-3" />
              </Link>
            );
          })}
          {active.length >= 2 && (
            <Link
              href={basePath}
              className="text-xs font-medium text-pangong hover:text-pangong-deep"
            >
              Clear all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
