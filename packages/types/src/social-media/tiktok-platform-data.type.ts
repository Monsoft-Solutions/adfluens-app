/**
 * TikTok Platform Data Type
 *
 * Platform-specific data for TikTok accounts.
 *
 * @module @repo/types/social-media/tiktok-platform-data
 */

import { z } from "zod";

/**
 * TikTok commerce user info schema
 */
export const tiktokCommerceUserInfoSchema = z.object({
  /** Whether user is a commerce user */
  commerceUser: z.boolean().optional(),

  /** Business category */
  category: z.string().nullable().optional(),

  /** Whether category button is shown */
  categoryButton: z.boolean().optional(),
});

/** TikTok commerce user info */
export type TikTokCommerceUserInfo = z.infer<
  typeof tiktokCommerceUserInfoSchema
>;

/**
 * TikTok profile tab settings schema
 */
export const tiktokProfileTabSchema = z.object({
  /** Show music tab */
  showMusicTab: z.boolean().optional(),

  /** Show question tab */
  showQuestionTab: z.boolean().optional(),

  /** Show playlist tab */
  showPlayListTab: z.boolean().optional(),
});

/** TikTok profile tab settings */
export type TikTokProfileTab = z.infer<typeof tiktokProfileTabSchema>;

/**
 * TikTok platform-specific data schema
 */
export const tiktokPlatformDataSchema = z.object({
  /** Platform discriminator */
  platform: z.literal("tiktok"),

  /** Short ID */
  shortId: z.string().nullable().optional(),

  /** Secure user ID */
  secUid: z.string().nullable().optional(),

  /** Total hearts/likes received */
  heartCount: z.number().nullable().optional(),

  /** Total video count */
  videoCount: z.number().nullable().optional(),

  /** Total digg count */
  diggCount: z.number().nullable().optional(),

  /** Friend count */
  friendCount: z.number().nullable().optional(),

  /** Commerce user information */
  commerceUserInfo: tiktokCommerceUserInfoSchema.nullable().optional(),

  /** Profile tab settings */
  profileTab: tiktokProfileTabSchema.nullable().optional(),

  /** Whether account is private */
  privateAccount: z.boolean().optional(),

  /** Whether user is an organization */
  isOrganization: z.boolean().optional(),

  /** User language */
  language: z.string().nullable().optional(),

  /** Account creation timestamp */
  createTime: z.number().nullable().optional(),

  /** Whether user is a TikTok seller */
  ttSeller: z.boolean().optional(),

  /** Duet setting */
  duetSetting: z.number().nullable().optional(),

  /** Stitch setting */
  stitchSetting: z.number().nullable().optional(),

  /** Download setting */
  downloadSetting: z.number().nullable().optional(),
});

/** TikTok platform-specific data */
export type TikTokPlatformData = z.infer<typeof tiktokPlatformDataSchema>;
