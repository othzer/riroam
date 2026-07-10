import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const contact = {
  contactName: z.string().trim().min(2, "Enter your name").max(100),
  contactPhone: z.string().trim().min(7, "Enter a valid phone number").max(20),
};

export const createPackageBookingSchema = z.object({
  bookingType: z.literal("PACKAGE"),
  packageId: z.string().min(1),
  startDate: dateString,
  guestCount: z.number().int().min(1).max(100),
  extraIds: z.array(z.string()).max(20),
  ...contact,
});

export const createHotelBookingSchema = z.object({
  bookingType: z.literal("HOTEL"),
  hotelId: z.string().min(1),
  roomId: z.string().min(1),
  startDate: dateString,
  endDate: dateString,
  guestCount: z.number().int().min(1).max(50),
  unitCount: z.number().int().min(1).max(20),
  ...contact,
});

export const createVehicleBookingSchema = z.object({
  bookingType: z.literal("VEHICLE"),
  vehicleId: z.string().min(1),
  startDate: dateString,
  endDate: dateString,
  guestCount: z.number().int().min(1).max(50),
  unitCount: z.number().int().min(1).max(20),
  ...contact,
});

export const createBookingSchema = z.discriminatedUnion("bookingType", [
  createPackageBookingSchema,
  createHotelBookingSchema,
  createVehicleBookingSchema,
]);

export type CreatePackageBookingInput = z.infer<typeof createPackageBookingSchema>;
export type CreateHotelBookingInput = z.infer<typeof createHotelBookingSchema>;
export type CreateVehicleBookingInput = z.infer<typeof createVehicleBookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
