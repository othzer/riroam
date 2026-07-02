import { z } from "zod";

// String-literal enums (not imported from @prisma/client) so this module is
// safe to import into client components without pulling Prisma into the bundle.
// Values match the Prisma BusinessType enum.
export const BUSINESS_TYPES = [
  "TOUR_AGENCY",
  "HOTEL",
  "HOMESTAY",
  "VEHICLE_RENTAL",
] as const;

export const BUSINESS_TYPE_LABELS: Record<
  (typeof BUSINESS_TYPES)[number],
  string
> = {
  TOUR_AGENCY: "Tour agency",
  HOTEL: "Hotel",
  HOMESTAY: "Homestay",
  VEHICLE_RENTAL: "Vehicle rental",
};

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short").max(80),
  businessType: z.enum(BUSINESS_TYPES),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  serviceAreas: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one service area")
    .max(20),
  gstNumber: z.string().trim().max(20).optional().or(z.literal("")),
  verificationDocUrl: z.string().url("Upload your verification document"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Storefront lite-customization (design §6). accentColor tints the banner and
// small underline accents only — never platform buttons.
export const storefrontSchema = z.object({
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour like #0D6E8F")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

export type StorefrontInput = z.infer<typeof storefrontSchema>;
