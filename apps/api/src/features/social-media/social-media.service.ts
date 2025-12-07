/**
 * Social Media Service
 *
 * Handles social media account data operations including scraping,
 * storing, and retrieving profile data from various platforms.
 *
 * @module api/features/social-media/social-media.service
 */

import {
  db,
  eq,
  and,
  socialMediaAccountTable,
  organizationProfileTable,
  type SocialMediaAccountRow,
} from "@repo/db";
import { scrapeInstagramProfile, extractInstagramHandle } from "@repo/scraper";
import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { SocialMediaPlatform } from "@repo/types/social-media/social-media-platform.enum";

/**
 * Generate a unique ID for social media accounts
 */
function generateSocialMediaAccountId(): string {
  return `sma_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the organization profile ID for an organization
 */
async function getOrganizationProfileId(
  organizationId: string
): Promise<string | null> {
  const result = await db
    .select({ id: organizationProfileTable.id })
    .from(organizationProfileTable)
    .where(eq(organizationProfileTable.organizationId, organizationId))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Get a social media account by organization and platform
 */
export async function getSocialMediaAccount(
  organizationId: string,
  platform: SocialMediaPlatform
): Promise<SocialMediaAccountRow | null> {
  const profileId = await getOrganizationProfileId(organizationId);

  if (!profileId) {
    return null;
  }

  const result = await db
    .select()
    .from(socialMediaAccountTable)
    .where(
      and(
        eq(socialMediaAccountTable.organizationProfileId, profileId),
        eq(socialMediaAccountTable.platform, platform)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Upsert a social media account (insert or update)
 */
async function upsertSocialMediaAccount(
  organizationProfileId: string,
  data: SocialMediaAccount,
  scrapedAt: Date
): Promise<SocialMediaAccountRow> {
  // Check if account already exists
  const existing = await db
    .select()
    .from(socialMediaAccountTable)
    .where(
      and(
        eq(
          socialMediaAccountTable.organizationProfileId,
          organizationProfileId
        ),
        eq(socialMediaAccountTable.platform, data.platform)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Update existing account
    const result = await db
      .update(socialMediaAccountTable)
      .set({
        platformUserId: data.platformUserId,
        username: data.username,
        displayName: data.displayName ?? null,
        bio: data.bio ?? null,
        profilePicUrl: data.profilePicUrl ?? null,
        profilePicUrlHd: data.profilePicUrlHd ?? null,
        externalUrl: data.externalUrl ?? null,
        followerCount: data.followerCount ?? null,
        followingCount: data.followingCount ?? null,
        isVerified: data.isVerified ?? false,
        isBusinessAccount: data.isBusinessAccount ?? false,
        platformData: data.platformData ?? null,
        scrapedAt,
      })
      .where(eq(socialMediaAccountTable.id, existing[0].id))
      .returning();

    return result[0]!;
  } else {
    // Insert new account
    const result = await db
      .insert(socialMediaAccountTable)
      .values({
        id: generateSocialMediaAccountId(),
        organizationProfileId,
        platform: data.platform,
        platformUserId: data.platformUserId,
        username: data.username,
        displayName: data.displayName ?? null,
        bio: data.bio ?? null,
        profilePicUrl: data.profilePicUrl ?? null,
        profilePicUrlHd: data.profilePicUrlHd ?? null,
        externalUrl: data.externalUrl ?? null,
        followerCount: data.followerCount ?? null,
        followingCount: data.followingCount ?? null,
        isVerified: data.isVerified ?? false,
        isBusinessAccount: data.isBusinessAccount ?? false,
        platformData: data.platformData ?? null,
        scrapedAt,
      })
      .returning();

    return result[0]!;
  }
}

/**
 * Scrape and save an Instagram profile
 * @param organizationProfileId - The organization profile ID to associate with
 * @param instagramUrl - The Instagram URL or handle
 * @returns The saved social media account
 */
export async function scrapeAndSaveInstagramProfile(
  organizationProfileId: string,
  instagramUrl: string
): Promise<SocialMediaAccountRow | null> {
  try {
    const result = await scrapeInstagramProfile(instagramUrl);

    if (!result.success || !result.data) {
      console.error(
        `[social-media] Failed to scrape Instagram ${instagramUrl}:`,
        result.error
      );
      return null;
    }

    const account = await upsertSocialMediaAccount(
      organizationProfileId,
      result.data,
      result.scrapedAt
    );

    return account;
  } catch (error) {
    console.error(
      `[social-media] Error scraping Instagram ${instagramUrl}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Refresh (re-scrape) a social media account
 * @param organizationId - The organization ID
 * @param platform - The social media platform
 * @returns The refreshed social media account
 */
export async function refreshSocialMediaAccount(
  organizationId: string,
  platform: SocialMediaPlatform
): Promise<SocialMediaAccountRow> {
  // Get the organization profile
  const profileResult = await db
    .select()
    .from(organizationProfileTable)
    .where(eq(organizationProfileTable.organizationId, organizationId))
    .limit(1);

  const profile = profileResult[0];

  if (!profile) {
    throw new Error("Organization profile not found");
  }

  // Get the platform URL from the organization profile
  let platformUrl: string | null = null;

  switch (platform) {
    case "instagram":
      platformUrl = profile.instagramUrl;
      break;
    case "facebook":
      platformUrl = profile.facebookUrl;
      break;
    case "tiktok":
      platformUrl = profile.tiktokUrl;
      break;
    case "twitter":
      platformUrl = profile.twitterUrl;
      break;
    case "linkedin":
      platformUrl = profile.linkedinUrl;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  if (!platformUrl) {
    throw new Error(`No ${platform} URL configured for this organization`);
  }

  // Scrape based on platform
  let account: SocialMediaAccountRow | null = null;

  switch (platform) {
    case "instagram":
      account = await scrapeAndSaveInstagramProfile(profile.id, platformUrl);
      break;
    default:
      throw new Error(`Scraping not yet implemented for ${platform}`);
  }

  if (!account) {
    throw new Error(`Failed to scrape ${platform} profile`);
  }

  return account;
}

/**
 * Extract Instagram handle from URL (re-export for router use)
 */
export { extractInstagramHandle };
