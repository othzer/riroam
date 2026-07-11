import type { Metadata } from "next";
import { PlannerClient } from "@/components/tourist/planner-client";

export const metadata: Metadata = {
  title: "Plan a trip",
  description:
    "Draft a day-by-day Ladakh itinerary from real, bookable RiRoam listings.",
};

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-ink">Plan a trip</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tell us where and how long. We draft a day-by-day itinerary from real
          listings — with safe-ascent days built in — that you can book straight away.
        </p>
      </div>
      <PlannerClient />
    </div>
  );
}
