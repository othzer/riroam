import { Search } from "lucide-react";

// Landing hero search — a plain GET form so it works with zero client JS and
// lands on /packages with the same searchParams the explore filter bar reads.
export function SearchCard() {
  return (
    <form
      action="/packages"
      method="get"
      className="grid grid-cols-1 divide-y divide-border rounded-card border border-border bg-surface shadow-lg sm:grid-cols-[1.2fr_1fr_0.8fr_auto] sm:divide-x sm:divide-y-0"
    >
      <Field label="Destination" name="destination" placeholder="Nubra, Pangong, Leh…" />
      <Field label="Dates" name="from" type="date" />
      <Field label="Travellers" name="travellers" type="number" placeholder="2" min={1} />
      <div className="flex items-center p-3">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] sm:w-auto"
        >
          <Search className="size-4" />
          Search
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-0.5 p-3 text-left">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        min={min}
        className="bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />
    </label>
  );
}
