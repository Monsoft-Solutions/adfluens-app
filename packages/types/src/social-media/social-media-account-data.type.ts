/**
 * Social Media Account Data Type
 *
 * Represents a social media account as returned from the API.
 * Extends the domain SocialMediaAccount with database record fields.
 *
 * @module @repo/types/social-media/social-media-account-data
 */

import type { PlatformData } from "./platform-data.type";

/**
 * Social media account data as returned from the API
 *
 * This type represents the full structure of a social media account
 * including both the domain fields and database record metadata.
 * Use this type for API responses and frontend components.
 */
export type SocialMediaAccountData = {
  /** Unique database identifier */
  id: string;

  /** Social media platform identifier */
  platform: string;

  /** Platform's unique user/account ID */
  platformUserId: string;

  /** Username/handle on the platform */
  username: string;

  /** Display name or full name */
  displayName: string | null;

  /** Bio or description */
  bio: string | null;

  /** Profile picture URL (standard resolution) */
  profilePicUrl: string | null;

  /** Profile picture URL (high resolution) */
  profilePicUrlHd: string | null;

  /** External URL (e.g., linktree, website) */
  externalUrl: string | null;

  /** Number of followers */
  followerCount: number | null;

  /** Number of accounts following */
  followingCount: number | null;

  /** Whether account is verified */
  isVerified: boolean;

  /** Whether account is a business/professional account */
  isBusinessAccount: boolean;

  /** Platform-specific metadata */
  platformData: PlatformData | null;

  /** When the data was last scraped */
  scrapedAt: Date | string | null;

  /** When the record was created */
  createdAt: Date | string;

  /** When the record was last updated */
  updatedAt: Date | string;
};
