import { z } from "zod";

export const searchResultItemSchema = z.object({
  id: z.object({
    videoId: z.string().optional(),
    channelId: z.string().optional(),
  }),
  snippet: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.string(),
    thumbnails: z.object({
      high: z.object({ url: z.string() }),
      medium: z.object({ url: z.string() }),
      default: z.object({ url: z.string() }),
    }),
    channelTitle: z.string(),
  }),
});

export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
