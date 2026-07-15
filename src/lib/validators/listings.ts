import { z } from "zod";

// String-literal enums (kept out of @prisma/client so these schemas are safe to
// import into client forms). Values match the Prisma enums.
export const PROPERTY_TYPES = ["HOTEL", "HOMESTAY"] as const;
export const VEHICLE_TYPES = ["TAXI", "BIKE"] as const;

export const PROPERTY_TYPE_LABELS: Record<
  (typeof PROPERTY_TYPES)[number],
  string
> = { HOTEL: "Hotel", HOMESTAY: "Homestay" };

export const VEHICLE_TYPE_LABELS: Record<
  (typeof VEHICLE_TYPES)[number],
  string
> = { TAXI: "Taxi", BIKE: "Bike" };

// Prices below are entered in rupees and converted to paise in the action.
const rupees = z
  .number({ message: "Enter a price" })
  .int("Whole rupees only")
  .min(1, "Enter a price")
  .max(100_000_000);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

// ── Package ────────────────────────────────────────────────────────────────
export const itineraryDaySchema = z.object({
  title: z.string().trim().min(3, "Add a day title").max(120),
  location: z.string().trim().min(1, "Add a location").max(80),
  altitudeMeters: z
    .number({ message: "Altitude in metres" })
    .int()
    .min(0)
    .max(9000, "That's higher than Everest"),
  description: z.string().trim().min(1, "Describe the day").max(2000),
});

export const extraSchema = z.object({
  // Present when editing an existing extra (named extraId, not id, because
  // react-hook-form's useFieldArray reserves `id` for its render keys).
  extraId: z.string().optional(),
  name: z.string().trim().min(2, "Name the extra").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  price: z.number({ message: "Price" }).int().min(0).max(100_000_000),
});

export const packageSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(120),
    description: z.string().trim().min(20, "Add a fuller description").max(4000),
    destinations: z.array(z.string().trim().min(1)).min(1, "Add at least one destination").max(20),
    startCity: z.string().trim().min(2, "Where does the tour start?").max(60),
    durationDays: z.number().int().min(1).max(60),
    durationNights: z.number().int().min(0).max(60),
    pricePerPerson: rupees,
    maxGroupSize: z.number().int().min(1).max(100),
    availableFrom: dateString,
    availableTo: dateString,
    freeCancellationDays: z.number().int().min(0).max(60),
    coverImageUrl: z.string().url("Add a cover image"),
    imageUrls: z.array(z.string().url()).max(12),
    itineraryDays: z.array(itineraryDaySchema).min(1, "Add at least one day").max(30),
    extras: z.array(extraSchema).max(20),
  })
  .refine((d) => new Date(d.availableTo) >= new Date(d.availableFrom), {
    message: "End date must be after the start date",
    path: ["availableTo"],
  });

export type PackageInput = z.infer<typeof packageSchema>;

// ── Hotel ──────────────────────────────────────────────────────────────────
export const roomSchema = z.object({
  // Present when editing an existing room (named roomId, not id, because
  // react-hook-form's useFieldArray reserves `id` for its render keys).
  roomId: z.string().optional(),
  name: z.string().trim().min(2, "Name the room").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  pricePerNight: rupees,
  capacity: z.number().int().min(1, "At least 1 guest").max(20),
  totalUnits: z.number().int().min(1, "At least 1 unit").max(200),
});

export const hotelSchema = z.object({
  name: z.string().trim().min(3, "Add a name").max(120),
  propertyType: z.enum(PROPERTY_TYPES),
  description: z.string().trim().min(20, "Add a fuller description").max(4000),
  address: z.string().trim().min(4, "Add an address").max(200),
  city: z.string().trim().min(2, "Add a city").max(60),
  state: z.string().trim().min(2, "Add a state").max(60),
  altitudeMeters: z.number().int().min(0).max(9000).optional(),
  amenities: z.array(z.string().trim().min(1)).max(40),
  freeCancellationDays: z.number().int().min(0).max(60),
  coverImageUrl: z.string().url("Add a cover image"),
  imageUrls: z.array(z.string().url()).max(12),
  rooms: z.array(roomSchema).min(1, "Add at least one room").max(20),
});

export type HotelInput = z.infer<typeof hotelSchema>;

// ── Vehicle ────────────────────────────────────────────────────────────────
export const vehicleSchema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES),
  title: z.string().trim().min(3, "Add a title").max(120),
  brand: z.string().trim().min(1, "Add a brand").max(60),
  model: z.string().trim().min(1, "Add a model").max(60),
  city: z.string().trim().min(2, "Add a city").max(60),
  state: z.string().trim().min(2, "Add a state").max(60),
  pricePerDay: rupees,
  seats: z.number().int().min(1).max(60).optional(),
  transmission: z.string().trim().max(20).optional().or(z.literal("")),
  fuelType: z.string().trim().max(20).optional().or(z.literal("")),
  totalUnits: z.number().int().min(1, "At least 1 unit").max(200),
  freeCancellationDays: z.number().int().min(0).max(60),
  coverImageUrl: z.string().url("Add a cover image"),
  imageUrls: z.array(z.string().url()).max(12),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export type ListingType = "package" | "hotel" | "vehicle";
