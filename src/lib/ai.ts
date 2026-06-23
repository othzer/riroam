import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { titleCase } from "@/lib/filters";
import { paiseToRupees } from "@/lib/money";
import type { ListingCardData } from "@/components/shared/listing-card";
import {
  planResponseSchema,
  type GenerateItineraryInput,
  type PlanResponse,
} from "@/lib/validators/plan";

// Gemini Flash tier — `gemini-flash-latest` tracks the current stable Flash
// model (the pinned 2.5-flash id is now closed to new API keys), giving us the
// fast, forced-JSON generation the grounded planner depends on.
const MODEL = "gemini-flash-latest";
const CANDIDATE_CAP = 15; // total packages + hotels sent to the model

/**
 * A retrieved listing carries two faces: `prompt` — the compact record the LLM
 * ranks — and `card` — the real, DB-backed listing the results UI renders.
 * The model never sees anything it could turn into a fake booking link.
 */
export type Candidate = {
  id: string;
  kind: "package" | "hotel";
  prompt: {
    id: string;
    kind: "package" | "hotel";
    title: string;
    location: string;
    priceRupees: number;
    priceUnit: "per person" | "per night";
    durationDays?: number;
    maxAltitudeMeters?: number;
    rating: number;
  };
  card: ListingCardData;
};

/** A single day of the resolved plan handed to the results UI. */
export type PlanDay = {
  day: number;
  title: string;
  description: string;
  estimatedCost: number; // paise
  listing: ListingCardData | null; // resolved real listing, or null for a travel/rest day
};

export type PlanResultData = {
  summary: string;
  totalEstimatedCost: number; // paise
  days: PlanDay[];
};

export type GenerateItineraryResult =
  | { ok: true; plan: PlanResultData }
  | { ok: false; kind: "empty" | "rate" | "error" | "invalid"; error: string };

let genai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (genai) return genai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  genai = new GoogleGenAI({ apiKey });
  return genai;
}

/**
 * Step 1 — RETRIEVE (architecture §9). Pure SQL: only published listings whose
 * destination/city, duration, budget and availability window match the request.
 * Packages priced per-person against `pricePerPerson × groupSize`; hotels by
 * their cheapest room. The LLM only ever ranks what this returns.
 */
export async function retrieveCandidates(
  input: GenerateItineraryInput,
): Promise<Candidate[]> {
  const { destinations, budgetMax, days, groupSize, startDate } = input;
  const budgetMaxPaise = budgetMax * 100;
  const start = startDate ? new Date(startDate) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;

  // Match a destination against text fields case-insensitively, plus the
  // exact/Title-Case forms for the String[] `destinations` column.
  const destVariants = destinations.flatMap((d) => [d, titleCase(d)]);

  const [packages, hotels] = await Promise.all([
    prisma.package.findMany({
      where: {
        isPublished: true,
        durationDays: { lte: days },
        pricePerPerson: { lte: Math.floor(budgetMaxPaise / groupSize) },
        ...(validStart && {
          availableFrom: { lte: validStart },
          availableTo: { gte: validStart },
        }),
        ...(destinations.length && {
          OR: [
            { destinations: { hasSome: destVariants } },
            ...destinations.map((d) => ({
              startCity: { contains: d, mode: "insensitive" as const },
            })),
          ],
        }),
      },
      orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { vendor: { select: { businessName: true } } },
    }),
    prisma.hotel.findMany({
      where: {
        isPublished: true,
        rooms: { some: { pricePerNight: { lte: budgetMaxPaise } } },
        ...(destinations.length && {
          OR: destinations.map((d) => ({
            city: { contains: d, mode: "insensitive" as const },
          })),
        }),
      },
      orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        vendor: { select: { businessName: true } },
        rooms: { select: { pricePerNight: true }, orderBy: { pricePerNight: "asc" }, take: 1 },
      },
    }),
  ]);

  const packageCandidates: Candidate[] = packages.map((p) => ({
    id: p.id,
    kind: "package",
    prompt: {
      id: p.id,
      kind: "package",
      title: p.title,
      location: `${p.startCity} → ${p.destinations.join(" → ")}`,
      priceRupees: paiseToRupees(p.pricePerPerson),
      priceUnit: "per person",
      durationDays: p.durationDays,
      maxAltitudeMeters: p.maxAltitudeMeters,
      rating: p.avgRating,
    },
    card: {
      href: `/packages/${p.slug}`,
      kind: "package",
      image: p.coverImageUrl,
      imageAlt: `${p.title} — ${p.destinations.join(", ")}`,
      title: p.title,
      routeLine: `${p.startCity} → ${p.destinations.join(" → ")} · ${p.durationDays}D/${p.durationNights}N`,
      priceLabel: "/person",
      priceAmount: p.pricePerPerson,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
      vendorName: p.vendor.businessName,
      altitudeMeters: p.maxAltitudeMeters,
    },
  }));

  const hotelCandidates: Candidate[] = hotels
    .filter((h) => h.rooms.length > 0)
    .map((h) => {
      const priceFrom = h.rooms[0].pricePerNight;
      return {
        id: h.id,
        kind: "hotel" as const,
        prompt: {
          id: h.id,
          kind: "hotel" as const,
          title: h.name,
          location: `${h.city}, ${h.state}`,
          priceRupees: paiseToRupees(priceFrom),
          priceUnit: "per night" as const,
          maxAltitudeMeters: h.altitudeMeters ?? undefined,
          rating: h.avgRating,
        },
        card: {
          href: `/hotels/${h.slug}`,
          kind: "hotel" as const,
          image: h.coverImageUrl,
          imageAlt: `${h.name} — ${h.city}`,
          title: h.name,
          routeLine: `${h.propertyType === "HOMESTAY" ? "Homestay" : "Hotel"} · ${h.city}`,
          priceLabel: "/night",
          priceAmount: priceFrom,
          avgRating: h.avgRating,
          reviewCount: h.reviewCount,
          vendorName: h.vendor.businessName,
          altitudeMeters: h.altitudeMeters ?? undefined,
        },
      };
    });

  // Interleave so a total cap never starves hotels of a slot.
  return [...packageCandidates, ...hotelCandidates].slice(0, CANDIDATE_CAP);
}

// Gemini responseSchema — biases the model to emit exactly the JSON we parse.
// Zod (planResponseSchema) remains the real gate; this just reduces retries.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          packageId: { type: Type.STRING, nullable: true },
          hotelId: { type: Type.STRING, nullable: true },
          estimatedCostRupees: { type: Type.NUMBER },
        },
        required: ["day", "title", "description", "estimatedCostRupees"],
      },
    },
    totalEstimatedCostRupees: { type: Type.NUMBER },
    selectedListingIds: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary", "days", "totalEstimatedCostRupees", "selectedListingIds"],
};

function buildPrompt(input: GenerateItineraryInput, candidates: Candidate[]): string {
  const compact = candidates.map((c) => c.prompt);
  const prefs = {
    destinations: input.destinations,
    days: input.days,
    groupSize: input.groupSize,
    budgetRangeRupees: [input.budgetMin, input.budgetMax],
    startDate: input.startDate || null,
    interests: input.interests,
  };
  return [
    "You are a Ladakh travel planner for the RiRoam marketplace.",
    "Build a day-by-day itinerary using ONLY the listings provided below.",
    "",
    "HARD RULES:",
    "1. Reference only the exact `id` values from CANDIDATES. Never invent an id or a listing.",
    "2. Not every day needs a listing — narrate travel/rest days without a packageId or hotelId.",
    "3. Set at most one of packageId or hotelId per day.",
    "4. Acclimatization: days 1 and 2 must stay below ~3,600 m. Schedule high passes and",
    "   high-altitude lakes (anything above ~3,600 m) from day 3 onward. Candidates carry",
    "   maxAltitudeMeters so you can obey this.",
    "5. Keep the plan within the traveller's budget range and day count.",
    "6. estimatedCostRupees and totalEstimatedCostRupees are whole rupees.",
    "7. selectedListingIds = every listing id you referenced across the days.",
    "",
    `TRAVELLER PREFERENCES:\n${JSON.stringify(prefs)}`,
    "",
    `CANDIDATES:\n${JSON.stringify(compact)}`,
  ].join("\n");
}

/** Parse + zod-validate one raw model response. */
function parsePlan(raw: string | undefined): PlanResponse | null {
  if (!raw) return null;
  try {
    const parsed = planResponseSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Steps 3–4 — GENERATE + VALIDATE. One retry on a parse/validation miss, then
 * give up gracefully. The caller (the action) does the ID hallucination guard
 * against the candidate set and persists the result.
 */
export async function runPlanner(
  input: GenerateItineraryInput,
  candidates: Candidate[],
): Promise<PlanResponse | null> {
  const client = getClient();
  const prompt = buildPrompt(input, candidates);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: attempt === 0 ? 0.7 : 0.3,
        },
      });
      const plan = parsePlan(response.text);
      if (plan) return plan;
    } catch (err) {
      // Network/model/quota errors must degrade to the graceful "couldn't
      // generate" state, never crash the action. Retry once, then give up.
      console.error("Gemini generateContent failed:", err);
    }
  }
  return null;
}
