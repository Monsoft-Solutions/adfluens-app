import { z } from "zod";

/**
 * Sort options for video search results
 */
export const VIDEO_SORT_OPTIONS = {
  VIEWS: "views",
  LIKES: "likes",
  COMMENTS: "comments",
  DATE: "date",
  RELEVANCE: "relevance",
} as const;

export const videoSortOptionSchema = z.enum([
  VIDEO_SORT_OPTIONS.VIEWS,
  VIDEO_SORT_OPTIONS.LIKES,
  VIDEO_SORT_OPTIONS.COMMENTS,
  VIDEO_SORT_OPTIONS.DATE,
  VIDEO_SORT_OPTIONS.RELEVANCE,
]);

export type VideoSortOption = z.infer<typeof videoSortOptionSchema>;

/**
 * Display labels for sort options
 */
export const VIDEO_SORT_LABELS: Record<VideoSortOption, string> = {
  [VIDEO_SORT_OPTIONS.VIEWS]: "Most Views",
  [VIDEO_SORT_OPTIONS.LIKES]: "Most Likes",
  [VIDEO_SORT_OPTIONS.COMMENTS]: "Most Comments",
  [VIDEO_SORT_OPTIONS.DATE]: "Newest First",
  [VIDEO_SORT_OPTIONS.RELEVANCE]: "Most Relevant",
};
