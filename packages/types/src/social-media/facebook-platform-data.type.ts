/**
 * Facebook Platform Data Type
 *
 * Platform-specific data for Facebook pages.
 *
 * @module @repo/types/social-media/facebook-platform-data
 */

import { z } from "zod";

/**
 * Facebook cover photo schema
 */
export const facebookCoverPhotoSchema = z.object({
  /** Photo ID */
  id: z.string().nullable().optional(),

  /** Photo URL */
  url: z.string().nullable().optional(),

  /** Image URI */
  imageUri: z.string().nullable().optional(),

  /** Image width */
  width: z.number().nullable().optional(),

  /** Image height */
  height: z.number().nullable().optional(),

  /** Focus point X */
  focusX: z.number().nullable().optional(),

  /** Focus point Y */
  focusY: z.number().nullable().optional(),
});

/** Facebook cover photo */
export type FacebookCoverPhoto = z.infer<typeof facebookCoverPhotoSchema>;

/**
 * Facebook ad library info schema
 */
export const facebookAdLibraryInfoSchema = z.object({
  /** Ad status description */
  adStatus: z.string().nullable().optional(),

  /** Page ID for ad library */
  pageId: z.string().nullable().optional(),
});

/** Facebook ad library info */
export type FacebookAdLibraryInfo = z.infer<typeof facebookAdLibraryInfoSchema>;

/**
 * Facebook platform-specific data schema
 */
export const facebookPlatformDataSchema = z.object({
  /** Platform discriminator */
  platform: z.literal("facebook"),

  /** Page URL */
  pageUrl: z.string().nullable().optional(),

  /** Page intro/about text */
  pageIntro: z.string().nullable().optional(),

  /** Business category */
  category: z.string().nullable().optional(),

  /** Physical address */
  address: z.string().nullable().optional(),

  /** Contact email */
  email: z.string().nullable().optional(),

  /** Contact phone */
  phone: z.string().nullable().optional(),

  /** Website URL */
  website: z.string().nullable().optional(),

  /** Price range indicator */
  priceRange: z.string().nullable().optional(),

  /** Page creation date */
  creationDate: z.string().nullable().optional(),

  /** Gender setting */
  gender: z.string().nullable().optional(),

  /** Total page likes */
  likeCount: z.number().nullable().optional(),

  /** Rating count */
  ratingCount: z.number().nullable().optional(),

  /** Whether business page is active */
  isBusinessPageActive: z.boolean().optional(),

  /** Cover photo information */
  coverPhoto: facebookCoverPhotoSchema.nullable().optional(),

  /** Ad library information */
  adLibrary: facebookAdLibraryInfoSchema.nullable().optional(),

  /** Associated links */
  links: z.array(z.string()).optional(),
});

/** Facebook platform-specific data */
export type FacebookPlatformData = z.infer<typeof facebookPlatformDataSchema>;
