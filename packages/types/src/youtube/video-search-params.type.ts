import { z } from "zod";
import {
  videoSortOptionSchema,
  VIDEO_SORT_OPTIONS,
} from "./video-sort-option.enum";

/**
 * Parameters for video search queries
 */
export const videoSearchParamsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  sortBy: videoSortOptionSchema.default(VIDEO_SORT_OPTIONS.VIEWS),
  maxResults: z.number().min(1).max(50).default(20),
});

export type VideoSearchParams = z.infer<typeof videoSearchParamsSchema>;
