/**
 * Platform Data Type
 *
 * Discriminated union of all platform-specific data types.
 *
 * @module @repo/types/social-media/platform-data
 */

import { z } from "zod";

import { instagramPlatformDataSchema } from "./instagram-platform-data.type";
import { tiktokPlatformDataSchema } from "./tiktok-platform-data.type";
import { facebookPlatformDataSchema } from "./facebook-platform-data.type";
import { youtubePlatformDataSchema } from "./youtube-platform-data.type";

/**
 * Platform-specific data discriminated union schema
 *
 * Each platform has a `platform` field that serves as the discriminator.
 */
export const platformDataSchema = z.discriminatedUnion("platform", [
  instagramPlatformDataSchema,
  tiktokPlatformDataSchema,
  facebookPlatformDataSchema,
  youtubePlatformDataSchema,
]);

/**
 * Platform-specific data type
 *
 * Discriminated union of Instagram, TikTok, Facebook, and YouTube platform data.
 */
export type PlatformData = z.infer<typeof platformDataSchema>;
