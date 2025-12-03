import { z } from "zod";
import { searchResultItemSchema } from "./search-result-item.type.js";

export const searchApiResponseSchema = z.object({
  items: z.array(searchResultItemSchema),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type SearchApiResponse = z.infer<typeof searchApiResponseSchema>;

