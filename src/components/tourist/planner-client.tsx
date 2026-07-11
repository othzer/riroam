"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import { generateItinerary } from "@/actions/ai";
import {
  generateItinerarySchema,
  PLAN_DESTINATIONS,
  PLAN_INTERESTS,
} from "@/lib/validators/plan";
import type { GenerateItineraryResult } from "@/lib/ai";
import { ListingCard } from "@/components/shared/listing-card";
import { Ridge } from "@/components/shared/ridge";
import { PrayerFlags } from "@/components/shared/prayer-flags";

const BUDGET_MIN = 0;
const BUDGET_MAX = 300_000; // rupees
const BUDGET_STEP = 5_000;

export function PlannerClient() {
  const [destinations, setDestinations] = useState<string[]>([]);
  const [days, setDays] = useState(5);
  const [groupSize, setGroupSize] = useState(2);
  const [budgetMin, setBudgetMin] = useState(20_000);
  const [budgetMax, setBudgetMax] = useState(150_000);
  const [startDate, setStartDate] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [result, setResult] = useState<GenerateItineraryResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function onSubmit() {
    setFormError(null);
    const input = {
      destinations,
      budgetMin: Math.min(budgetMin, budgetMax),
      budgetMax: Math.max(budgetMin, budgetMax),
      days,
      startDate: startDate || undefined,
      groupSize,
      interests,
    };
    const parsed = generateItinerarySchema.safeParse(input);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the form and try again");
      return;
    }
    startTransition(async () => {
      const res = await generateItinerary(parsed.data);
      setResult(res);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      {/* ---- form ---- */}
      <form
        className="h-fit rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Field label="Where to" hint="Pick one or more">
          <div className="flex flex-wrap gap-2">
            {PLAN_DESTINATIONS.map((d) => (
              <Chip
                key={d}
                active={destinations.includes(d)}
                onClick={() => setDestinations((l) => toggle(l, d))}
              >
                {d}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Days">
            <Stepper value={days} min={1} max={21} onChange={setDays} />
          </Field>
          <Field label="Travellers">
            <Stepper value={groupSize} min={1} max={20} onChange={setGroupSize} />
          </Field>
        </div>

        <Field label="Budget" hint="Total, all travellers">
          <div className="space-y-3">
            <RangeRow
              label="Min"
              value={budgetMin}
              onChange={(v) => setBudgetMin(Math.min(v, budgetMax))}
            />
            <RangeRow
              label="Max"
              value={budgetMax}
              onChange={(v) => setBudgetMax(Math.max(v, budgetMin))}
            />
          </div>
        </Field>

        <Field label="Start date" hint="Optional">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-full rounded-control border border-border bg-paper px-3 font-mono text-sm text-ink outline-none focus-visible:border-pangong focus-visible:ring-2 focus-visible:ring-pangong/30"
          />
        </Field>

        <Field label="Interests" hint="Optional">
          <div className="flex flex-wrap gap-2">
            {PLAN_INTERESTS.map((i) => (
              <Chip
                key={i}
                active={interests.includes(i)}
                onClick={() => setInterests((l) => toggle(l, i))}
              >
                {i}
              </Chip>
            ))}
          </div>
        </Field>

        {formError && (
          <p className="mt-3 text-sm text-danger">{formError}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-control bg-apricot px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-apricot-hover disabled:opacity-60"
        >
          <Sparkles className="size-4" />
          {isPending ? "Building your plan…" : "Build my plan"}
        </button>
      </form>

      {/* ---- results ---- */}
      <div>
        {isPending ? (
          <TimelineSkeleton />
        ) : result?.ok ? (
          <PlanResult result={result} />
        ) : result ? (
          <ResultMessage kind={result.kind} message={result.error} />
        ) : (
          <IdleHint />
        )}
      </div>
    </div>
  );
}

/* ---------- results ---------- */

function PlanResult({ result }: { result: Extract<GenerateItineraryResult, { ok: true }> }) {
  const { plan } = result;
  return (
    <div>
      <div className="rounded-card border border-border bg-sand-deep p-5">
        <p className="text-sm leading-relaxed text-ink">{plan.summary}</p>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-xs font-medium tracking-wide text-ink-soft uppercase">
            Estimated total
          </span>
          <span className="font-mono text-lg font-bold text-ink">
            {formatINR(plan.totalEstimatedCost)}
          </span>
        </div>
      </div>

      <ol className="mt-5 space-y-5">
        {plan.days.map((d) => (
          <li key={d.day} className="relative pl-14">
            <div className="absolute top-0 left-0 flex h-9 w-11 items-center justify-center rounded-chip bg-ink font-mono text-xs font-medium tracking-wide text-white">
              D{d.day}
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-base font-bold text-ink">{d.title}</h3>
              {d.estimatedCost > 0 && (
                <span className="shrink-0 font-mono text-xs text-ink-muted">
                  {formatINR(d.estimatedCost)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{d.description}</p>
            {d.listing && (
              <div className="mt-3 max-w-sm">
                <ListingCard data={d.listing} />
              </div>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-ink-muted">
        Every listing above is a real, bookable RiRoam listing — open one to reserve.
      </p>
    </div>
  );
}

function ResultMessage({ kind, message }: { kind: string; message: string }) {
  const title =
    kind === "empty"
      ? "Nothing matched those filters"
      : kind === "rate"
        ? "You've hit today's limit"
        : "Couldn't build a plan";
  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-surface px-6 py-14 text-center">
      <div className="mb-5 w-32 opacity-70">
        <Ridge className="rounded-control" back="#E2DDD1" mid="#C9C2B2" front="#EFEAE0" />
      </div>
      <h3 className="font-heading text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{message}</p>
      {kind === "empty" && (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Try raising the budget, adding a destination, or clearing the start date.
        </p>
      )}
      <PrayerFlags className="mt-6" />
    </div>
  );
}

function IdleHint() {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center">
      <Sparkles className="size-6 text-pangong" />
      <h3 className="mt-3 font-heading text-lg font-bold text-ink">
        A plan from real listings
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        Set your destinations, days and budget, and I&apos;ll draft a day-by-day itinerary.
        Every suggestion is a real, bookable listing — never an invented hotel.
      </p>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-28 rounded-card bg-sand" />
      <div className="mt-5 space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative pl-14">
            <div className="absolute top-0 left-0 h-9 w-11 rounded-chip bg-sand" />
            <div className="h-4 w-1/2 rounded bg-sand" />
            <div className="mt-2 h-3 w-full rounded bg-sand" />
            <div className="mt-1.5 h-3 w-2/3 rounded bg-sand" />
            <div className="mt-3 h-48 max-w-sm rounded-card bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- form primitives ---------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline gap-2">
        <label className="text-sm font-medium text-ink">{label}</label>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-chip border px-3 py-1.5 text-sm capitalize transition-colors",
        active
          ? "border-pangong bg-pangong-tint font-medium text-pangong-deep"
          : "border-border bg-paper text-ink-soft hover:border-ink/20",
      )}
    >
      {children}
    </button>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <StepButton
        label="decrease"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="size-4" />
      </StepButton>
      <span className="w-8 text-center font-mono text-base font-medium text-ink">{value}</span>
      <StepButton
        label="increase"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="size-4" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-control border border-border bg-paper text-ink transition-colors hover:border-ink/20 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RangeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-xs text-ink-muted">{label}</span>
      <input
        type="range"
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={BUDGET_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-pangong"
      />
      <span className="w-20 text-right font-mono text-xs text-ink">{formatINR(value * 100)}</span>
    </div>
  );
}
