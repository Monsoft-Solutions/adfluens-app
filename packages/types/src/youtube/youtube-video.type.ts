import { z } from "zod";

export const youtubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
  viewCount: z.string(),
  likeCount: z.string(),
  commentCount: z.string(),
  publishedAt: z.string(),
  channelTitle: z.string(),
});

export type YouTubeVideo = z.infer<typeof youtubeVideoSchema>;

