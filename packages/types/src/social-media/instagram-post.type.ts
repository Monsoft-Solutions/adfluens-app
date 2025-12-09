/**
 * Instagram Post Type
 *
 * Domain types for Instagram posts stored in the database.
 *
 * @module @repo/types/social-media/instagram-post
 */

import { z } from "zod";

/**
 * Instagram post media type
 *
 * - image: Single photo post
 * - video: Video or Reel
 * - carousel: Multiple images/videos in one post
 */
export const instagramPostMediaTypeSchema = z.enum([
  "image",
  "video",
  "carousel",
]);

export type InstagramPostMediaType = z.infer<
  typeof instagramPostMediaTypeSchema
>;

/**
 * Instagram product type
 *
 * - clips: Instagram Reels
 * - feed: Regular feed posts
 */
export const instagramProductTypeSchema = z.enum(["clips", "feed"]);

export type InstagramProductType = z.infer<typeof instagramProductTypeSchema>;

/**
 * Media item within a post (image or video URL)
 */
export const instagramPostMediaSchema = z.object({
  /** Media URL (GCS or public URL) */
  url: z.string(),

  /** Original Media URL (from source) */
  originalUrl: z.string().optional(),

  /** Width in pixels */
  width: z.number(),

  /** Height in pixels */
  height: z.number(),

  /** Media type: image or video */
  type: z.enum(["image", "video"]),
});

export type InstagramPostMedia = z.infer<typeof instagramPostMediaSchema>;

/**
 * Instagram post domain type
 *
 * Normalized structure for storing Instagram posts.
 */
export const instagramPostSchema = z.object({
  /** Instagram's unique post ID */
  platformPostId: z.string(),

  /** Post shortcode (used in URLs, e.g., "DRx75f1DlHy") */
  shortcode: z.string(),

  /** Type of media: image, video, or carousel */
  mediaType: instagramPostMediaTypeSchema,

  /** Product type: clips (reel) or feed (regular post) */
  productType: instagramProductTypeSchema.nullable(),

  /** Post caption/description text */
  caption: z.string().nullable(),

  /** Full URL to the post */
  postUrl: z.string(),

  /** Thumbnail/display image URL (GCS only, null if upload failed) */
  thumbnailUrl: z.string().nullable(),

  /** Original Thumbnail URL (from source) */
  originalThumbnailUrl: z.string().optional().nullable(),

  /** Number of video plays (for videos/reels) */
  playCount: z.number().nullable(),

  /** Number of likes */
  likeCount: z.number(),

  /** Number of comments */
  commentCount: z.number(),

  /** Video duration in seconds (for videos/reels) */
  videoDuration: z.number().nullable(),

  /** Whether the video has audio */
  hasAudio: z.boolean().nullable(),

  /** Timestamp when post was created */
  takenAt: z.date(),

  /** Array of media URLs (images/videos) */
  mediaUrls: z.array(instagramPostMediaSchema),
});

export type InstagramPost = z.infer<typeof instagramPostSchema>;
