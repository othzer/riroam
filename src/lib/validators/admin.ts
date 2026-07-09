import { z } from "zod";

export const rejectVendorSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a brief reason (shown to the vendor)")
    .max(500),
});

export type RejectVendorInput = z.infer<typeof rejectVendorSchema>;
