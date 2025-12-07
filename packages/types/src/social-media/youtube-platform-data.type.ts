/**
 * YouTube Platform Data Type
 *
 * Platform-specific data for YouTube channels.
 *
 * @module @repo/types/social-media/youtube-platform-data
 */

import { z } from "zod";

/**
 * YouTube avatar source schema
 */
export const youtubeAvatarSourceSchema = z.object({
  /** Avatar URL */
  url: z.string(),

  /** Image width */
  width: z.number().optional(),

  /** Image height */
  height: z.number().optional(),
});

/** YouTube avatar source */
export type YouTubeAvatarSource = z.infer<typeof youtubeAvatarSourceSchema>;

/**
 * YouTube platform-specific data schema
 */
export const youtubePlatformDataSchema = z.object({
  /** Platform discriminator */
  platform: z.literal("youtube"),

  /** Channel ID */
  channelId: z.string().nullable().optional(),

  /** Channel handle (e.g., @AlluringPlasticSurgery) */
  handle: z.string().nullable().optional(),

  /** Channel URL */
  channelUrl: z.string().nullable().optional(),

  /** Subscriber count */
  subscriberCount: z.number().nullable().optional(),

  /** Subscriber count text (formatted) */
  subscriberCountText: z.string().nullable().optional(),

  /** Total video count */
  videoCount: z.number().nullable().optional(),

  /** Video count text (formatted) */
  videoCountText: z.string().nullable().optional(),

  /** Total view count */
  viewCount: z.number().nullable().optional(),

  /** View count text (formatted) */
  viewCountText: z.string().nullable().optional(),

  /** Channel joined date */
  joinedDate: z.string().nullable().optional(),

  /** Channel tags */
  tags: z.array(z.string()).nullable().optional(),

  /** Contact email */
  email: z.string().nullable().optional(),

  /** Avatar sources with different sizes */
  avatarSources: z.array(youtubeAvatarSourceSchema).optional(),

  /** Associated links */
  links: z.array(z.string()).optional(),

  /** Instagram link */
  instagramUrl: z.string().nullable().optional(),

  /** Facebook link */
  facebookUrl: z.string().nullable().optional(),

  /** TikTok link */
  tiktokUrl: z.string().nullable().optional(),

  /** Website link */
  websiteUrl: z.string().nullable().optional(),
});

/** YouTube platform-specific data */
export type YouTubePlatformData = z.infer<typeof youtubePlatformDataSchema>;
