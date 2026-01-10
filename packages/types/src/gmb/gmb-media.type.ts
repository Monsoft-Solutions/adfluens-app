/**
 * Google Business Profile Media Types
 *
 * Types for managing photos and videos on GMB locations.
 *
 * @module @repo/types/gmb/gmb-media
 */

import { z } from "zod";

/**
 * Media category schema
 */
export const gmbMediaCategorySchema = z.enum([
  "COVER",
  "PROFILE",
  "INTERIOR",
  "EXTERIOR",
  "FOOD_AND_DRINK",
  "MENU",
  "PRODUCT",
  "TEAM",
  "ADDITIONAL",
]);

export type GMBMediaCategory = z.infer<typeof gmbMediaCategorySchema>;

/**
 * Media format schema
 */
export const gmbMediaFormatSchema = z.enum(["PHOTO", "VIDEO"]);

export type GMBMediaFormat = z.infer<typeof gmbMediaFormatSchema>;

/**
 * Media item schema
 */
export const gmbMediaItemSchema = z.object({
  /** Full resource name of the media */
  name: z.string(),

  /** Format of the media */
  mediaFormat: gmbMediaFormatSchema,

  /** Google-hosted URL for the media */
  googleUrl: z.string(),

  /** Thumbnail URL for the media */
  thumbnailUrl: z.string().optional(),

  /** Category of the media */
  category: gmbMediaCategorySchema,

  /** When the media was created */
  createTime: z.string(),

  /** Dimensions of the media */
  dimensions: z
    .object({
      widthPixels: z.number(),
      heightPixels: z.number(),
    })
    .optional(),

  /** View insights for the media */
  insights: z
    .object({
      viewCount: z.string(),
    })
    .optional(),

  /** Description/attribution for the media */
  description: z.string().optional(),
});

export type GMBMediaItem = z.infer<typeof gmbMediaItemSchema>;

/**
 * Media list response schema
 */
export const gmbMediaResponseSchema = z.object({
  /** List of media items */
  mediaItems: z.array(gmbMediaItemSchema),

  /** Token for fetching the next page */
  nextPageToken: z.string().optional(),

  /** Total count of media items */
  totalMediaItemCount: z.number().optional(),
});

export type GMBMediaResponse = z.infer<typeof gmbMediaResponseSchema>;

/**
 * Upload media input schema
 */
export const gmbUploadMediaInputSchema = z.object({
  /** Source URL for the media */
  sourceUrl: z.string().url(),

  /** Category for the media */
  category: gmbMediaCategorySchema,

  /** Optional description */
  description: z.string().max(500).optional(),
});

export type GMBUploadMediaInput = z.infer<typeof gmbUploadMediaInputSchema>;
