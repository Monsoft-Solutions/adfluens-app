import { z } from "zod";

export const videoDetailsItemSchema = z.object({
  id: z.string(),
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
  statistics: z.object({
    viewCount: z.string(),
    likeCount: z.string(),
    commentCount: z.string(),
  }),
});

export type VideoDetailsItem = z.infer<typeof videoDetailsItemSchema>;
