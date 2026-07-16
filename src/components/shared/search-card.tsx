import { Search } from "lucide-react";

// Landing hero search — a plain GET form so it works with zero client JS and
// lands on /packages with the same searchParams the explore filter bar reads.
// Every field here must be one the results page actually consumes: a control
// that quietly does nothing is worse than no control at all.
export function SearchCard({ today }: { today: string }) {
  return (
    <form
      action="/packages"
      method="get"
      className="relative z-10 grid grid-cols-1 divide-y divide-border rounded-card border border-border bg-white p-2 shadow-lg sm:grid-cols-[1.4fr_1fr_auto] sm:divide-x sm:divide-y-0"
    >
      <Field label="Where in Ladakh" name="destination" placeholder="Nubra, Pangong, Leh…" />
      <Field label="Starting from" name="from" type="date" min={today} />
      <div className="flex items-center p-1.5">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot px-5 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] sm:w-auto"
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
  min?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5 px-3 py-2 text-left">
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        min={min}
        className="bg-transparent text-[12.5px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-muted"
      />
    </label>
  );
}
