import { z } from "zod";

// No .default()/.transform() on these fields — that would make the schema's
// input type diverge from its output type and break useForm<ProfileInput>().
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  image: z.string().url("That doesn't look like an image URL").or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
