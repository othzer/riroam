import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().min(4, "Add a few words").max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const replyReviewSchema = z.object({
  reply: z.string().trim().min(2, "Write a reply").max(1000),
});

export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
