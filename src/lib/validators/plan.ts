import { z } from "zod";

/**
 * Curated destination chips and interest tags for the planner form. Kept as
 * const tuples so the UI can map over them and the schema can stay plain
 * `z.array(z.string())` — the union-of-literals form would fight
 * react-hook-form's generics (see the .default()/.coerce gotcha we hit in
 * earlier phases).
 */
export const PLAN_DESTINATIONS = [
  "Leh",
  "Nubra",
  "Pangong",
  "Sham Valley",
  "Zanskar",
  "Tso Moriri",
  "Kargil",
  "Turtuk",
] as const;

export const PLAN_INTERESTS = [
  "adventure",
  "culture",
  "food",
  "nature",
  "spiritual",
  "photography",
  "biking",
  "trekking",
] as const;

/**
 * Planner input. Budget is collected in whole rupees on the form and converted
 * to paise server-side; days/groupSize are plain numbers (no coercion in the
 * schema — the form registers them with `valueAsNumber`).
 */
export const generateItinerarySchema = z
  .object({
    destinations: z
      .array(z.string().trim().min(1))
      .min(1, "Pick at least one destination")
      .max(6, "Pick up to six destinations"),
    budgetMin: z.number().int().min(0, "Budget can't be negative"),
    budgetMax: z.number().int().min(1, "Set a maximum budget"),
    days: z.number().int().min(1, "At least one day").max(21, "Up to 21 days"),
    // ISO date string from <input type="date">; optional.
    startDate: z.string().trim().optional().or(z.literal("")),
    groupSize: z.number().int().min(1, "At least one traveller").max(20, "Up to 20 travellers"),
    interests: z.array(z.string()).max(8),
  })
  .refine((d) => d.budgetMax >= d.budgetMin, {
    message: "Maximum budget must be at least the minimum",
    path: ["budgetMax"],
  });

export type GenerateItineraryInput = z.infer<typeof generateItinerarySchema>;

/**
 * Shape the LLM must return (also pinned as a Gemini responseSchema in lib/ai).
 * Money comes back as whole rupees — the model reasons in rupees, and the
 * authoritative price of any referenced listing is still read from the DB.
 * IDs are validated against the candidate set after parsing (hallucination
 * guard), so they're plain strings here.
 */
export const planResponseSchema = z.object({
  summary: z.string(),
  days: z.array(
    z.object({
      day: z.number().int(),
      title: z.string(),
      description: z.string(),
      packageId: z.string().nullish(),
      hotelId: z.string().nullish(),
      estimatedCostRupees: z.number().nonnegative(),
    }),
  ),
  totalEstimatedCostRupees: z.number().nonnegative(),
  selectedListingIds: z.array(z.string()),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;
