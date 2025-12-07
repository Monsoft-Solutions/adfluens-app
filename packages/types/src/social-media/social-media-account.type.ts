/**
 * Social Media Account Type
 *
 * Common fields across all social media platforms.
 *
 * @module @repo/types/social-media/social-media-account
 */

import { z } from "zod";

import { SocialMediaPlatform } from "./social-media-platform.enum";
import { platformDataSchema } from "./platform-data.type";

/**
 * Social media account schema
 *
 * Defines the common structure for all social media account profiles.
 */
export const socialMediaAccountSchema = z.object({
  /** Social media platform identifier */
  platform: z.enum(SocialMediaPlatform).describe("Social media platform"),

  /** Platform's unique user/account ID */
  platformUserId: z
    .string()
    .describe("Platform's unique identifier for the account"),

  /** Username/handle (e.g., @alluringplasticsurgery) */
  username: z.string().describe("Username or handle on the platform"),

  /** Display name or full name */
  displayName: z.string().nullable().optional().describe("Display name"),

  /** Bio or description */
  bio: z
    .string()
    .nullable()
    .optional()
    .describe("Account biography/description"),

  /** Profile picture URL (standard resolution) */
  profilePicUrl: z
    .string()
    .nullable()
    .optional()
    .describe("Profile picture URL"),

  /** Profile picture URL (high resolution) */
  profilePicUrlHd: z
    .string()
    .nullable()
    .optional()
    .describe("High-resolution profile picture URL"),

  /** External URL (e.g., linktree, website) */
  externalUrl: z
    .string()
    .nullable()
    .optional()
    .describe("External/website URL"),

  /** Follower count */
  followerCount: z
    .number()
    .nullable()
    .optional()
    .describe("Number of followers"),

  /** Following count */
  followingCount: z
    .number()
    .nullable()
    .optional()
    .describe("Number of accounts following"),

  /** Whether account is verified */
  isVerified: z.boolean().default(false).describe("Verification status"),

  /** Whether account is a business/professional account */
  isBusinessAccount: z
    .boolean()
    .default(false)
    .describe("Business account status"),

  /** Platform-specific data */
  platformData: platformDataSchema
    .nullable()
    .optional()
    .describe("Platform-specific metadata"),
});

/** Social media account type */
export type SocialMediaAccount = z.infer<typeof socialMediaAccountSchema>;
