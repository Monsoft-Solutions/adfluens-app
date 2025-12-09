/**
 * TikTok Post Type
 *
 * Domain types for TikTok posts stored in the database.
 *
 * @module @repo/types/social-media/tiktok-post
 */

import { z } from "zod";

/**
 * TikTok post domain type
 *
 * Normalized structure for storing TikTok posts.
 * All TikTok posts are videos, so no media type differentiation needed.
 */
export const tiktokPostSchema = z.object({
  /** TikTok's unique post ID (aweme_id) */
  platformPostId: z.string(),

  /** Post shortcode - same as aweme_id for TikTok (used for URL construction) */
  shortcode: z.string(),

  /** Post caption/description text */
  caption: z.string().nullable(),

  /** Full URL to the post */
  postUrl: z.string(),

  /** Thumbnail/cover image URL (GCS only, null if upload failed) */
  thumbnailUrl: z.string().nullable(),

  /** Original Thumbnail URL (from source) */
  originalThumbnailUrl: z.string().optional().nullable(),

  /** Video URL (GCS only, null if upload failed) */
  videoUrl: z.string().nullable(),

  /** Original Video URL (from source) */
  originalVideoUrl: z.string().optional().nullable(),

  /** Number of video plays/views */
  playCount: z.number().nullable(),

  /** Number of likes (digg_count in TikTok API) */
  likeCount: z.number(),

  /** Number of comments */
  commentCount: z.number(),

  /** Number of shares */
  shareCount: z.number(),

  /** Number of saves/collects */
  collectCount: z.number().nullable(),

  /** Video duration in seconds */
  videoDuration: z.number().nullable(),

  /** Video width in pixels */
  videoWidth: z.number().nullable(),

  /** Video height in pixels */
  videoHeight: z.number().nullable(),

  /** Timestamp when post was created */
  takenAt: z.date(),

  /** Region code (e.g., "US") */
  region: z.string().nullable(),

  /** Description language */
  descLanguage: z.string().nullable(),
});

export type TiktokPost = z.infer<typeof tiktokPostSchema>;
