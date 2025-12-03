import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

