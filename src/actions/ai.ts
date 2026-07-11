"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  retrieveCandidates,
  runPlanner,
  type Candidate,
  type GenerateItineraryResult,
  type PlanDay,
} from "@/lib/ai";
import {
  generateItinerarySchema,
  type GenerateItineraryInput,
} from "@/lib/validators/plan";

// A DB-backed rate limit is fine at this scale and fully explainable — no Redis.
// /plan is login-gated (proxy.ts §3.4), so every planner run has a real user.
const DAILY_LIMIT = 10;

function startOfUtcToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * The planner pipeline end to end (architecture §9): retrieve real inventory →
 * guard on zero → schema-constrained generation → validate → drop any id the
 * model invented → resolve each referenced id to its real ListingCard → persist
 * an audit trail. The model ranks and narrates; it can never conjure a listing.
 */
export async function generateItinerary(
  input: GenerateItineraryInput,
): Promise<GenerateItineraryResult> {
  const session = await requireUser();
  const userId = session.user.id;

  const parsed = generateItinerarySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "invalid",
      error: parsed.error.issues[0]?.message ?? "Check the form and try again",
    };
  }
  const data = parsed.data;

  // Rate limit — count today's plans for this user.
  const todayCount = await prisma.itineraryPlan.count({
    where: { userId, createdAt: { gte: startOfUtcToday() } },
  });
  if (todayCount >= DAILY_LIMIT) {
    return {
      ok: false,
      kind: "rate",
      error: `You've reached today's limit of ${DAILY_LIMIT} plans. Try again tomorrow.`,
    };
  }

  // Step 1–2: retrieve + guard. Zero candidates → no LLM call.
  const candidates = await retrieveCandidates(data);
  if (candidates.length === 0) {
    return {
      ok: false,
      kind: "empty",
      error: "No listings match those filters. Try widening your budget or dates.",
    };
  }

  // Step 3–4: generate + validate.
  const plan = await runPlanner(data, candidates);
  if (!plan) {
    return {
      ok: false,
      kind: "error",
      error: "Couldn't build a plan just now. Try again in a moment.",
    };
  }

  // Step 4 (guard) + 5 (resolve): map every referenced id to a real listing,
  // silently dropping anything not in the candidate set.
  const byId = new Map<string, Candidate>(candidates.map((c) => [c.id, c]));
  const days: PlanDay[] = plan.days.map((d) => {
    const id = d.packageId || d.hotelId || null;
    const candidate = id ? byId.get(id) : undefined;
    return {
      day: d.day,
      title: d.title,
      description: d.description,
      estimatedCost: Math.round(d.estimatedCostRupees) * 100,
      listing: candidate ? candidate.card : null,
    };
  });

  // Persist inputs, the candidate audit trail, and the validated result.
  await prisma.itineraryPlan.create({
    data: {
      userId,
      destinations: data.destinations,
      budgetMin: data.budgetMin * 100,
      budgetMax: data.budgetMax * 100,
      days: data.days,
      startDate: data.startDate ? new Date(data.startDate) : null,
      groupSize: data.groupSize,
      interests: data.interests,
      candidateIds: candidates.map((c) => c.id),
      resultJson: plan as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    ok: true,
    plan: {
      summary: plan.summary,
      totalEstimatedCost: Math.round(plan.totalEstimatedCostRupees) * 100,
      days,
    },
  };
}
