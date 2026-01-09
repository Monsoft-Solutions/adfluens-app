/**
 * Instagram Platform Data Type
 *
 * Platform-specific data for Instagram accounts.
 *
 * @module @repo/types/social-media/instagram-platform-data
 */

import { z } from "zod";

/**
 * Instagram business address schema
 */
export const instagramBusinessAddressSchema = z.object({
  /** City name */
  cityName: z.string().nullable().optional(),

  /** City ID from Facebook */
  cityId: z.number().nullable().optional(),

  /** Latitude coordinate */
  latitude: z.number().nullable().optional(),

  /** Longitude coordinate */
  longitude: z.number().nullable().optional(),

  /** Street address */
  streetAddress: z.string().nullable().optional(),

  /** ZIP/postal code */
  zipCode: z.string().nullable().optional(),
});

/** Instagram business address */
export type InstagramBusinessAddress = z.infer<
  typeof instagramBusinessAddressSchema
>;

/**
 * Instagram bio link schema
 */
export const instagramBioLinkSchema = z.object({
  /** Link title */
  title: z.string().optional(),

  /** Full URL */
  url: z.string(),

  /** Lynx URL (Instagram's internal redirect) */
  lynxUrl: z.string().optional(),

  /** Link type (e.g., external) */
  linkType: z.string().optional(),
});

/** Instagram bio link */
export type InstagramBioLink = z.infer<typeof instagramBioLinkSchema>;

/**
 * Instagram platform-specific data schema
 */
export const instagramPlatformDataSchema = z.object({
  /** Platform discriminator */
  platform: z.literal("instagram"),

  /** Facebook ID connection */
  fbid: z.string().nullable().optional(),

  /** Business category name */
  categoryName: z.string().nullable().optional(),

  /** Business address information */
  businessAddress: instagramBusinessAddressSchema.nullable().optional(),

  /** Bio links array */
  bioLinks: z.array(instagramBioLinkSchema).optional(),

  /** Total posts count */
  postsCount: z.number().nullable().optional(),

  /** Total reels/video count */
  reelsCount: z.number().nullable().optional(),

  /** Whether account is private */
  isPrivate: z.boolean().optional(),

  /** Whether account is a professional account */
  isProfessionalAccount: z.boolean().optional(),

  /** HD profile picture URL */
  profilePicUrlHd: z.string().nullable().optional(),
});

/** Instagram platform-specific data */
export type InstagramPlatformData = z.infer<typeof instagramPlatformDataSchema>;
