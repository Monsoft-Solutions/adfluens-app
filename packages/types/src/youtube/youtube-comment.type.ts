import { z } from "zod";

export const youtubeCommentSchema = z.object({
  id: z.string(),
  authorDisplayName: z.string(),
  authorProfileImageUrl: z.string(),
  textDisplay: z.string(),
  publishedAt: z.string(),
  likeCount: z.string(),
});

export type YouTubeComment = z.infer<typeof youtubeCommentSchema>;
