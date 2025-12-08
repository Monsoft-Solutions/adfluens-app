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
  desc,
  socialMediaAccountTable,
  socialMediaPostTable,
  organizationProfileTable,
  type SocialMediaAccountRow,
  type SocialMediaPostRow,
} from "@repo/db";
import {
  scrapeInstagramProfile,
  extractInstagramHandle,
  scrapeFacebookPage,
  extractFacebookHandle,
  scrapeTiktokProfile,
  extractTiktokHandle,
  scrapeInstagramPosts,
} from "@repo/scraper";
import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { SocialMediaPlatform } from "@repo/types/social-media/social-media-platform.enum";
import type { InstagramPost } from "@repo/types/social-media/instagram-post.type";

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
 * Scrape and save a Facebook page
 * @param organizationProfileId - The organization profile ID to associate with
 * @param facebookUrl - The Facebook page URL or handle
 * @returns The saved social media account
 */
export async function scrapeAndSaveFacebookProfile(
  organizationProfileId: string,
  facebookUrl: string
): Promise<SocialMediaAccountRow | null> {
  try {
    const result = await scrapeFacebookPage(facebookUrl);

    if (!result.success || !result.data) {
      console.error(
        `[social-media] Failed to scrape Facebook ${facebookUrl}:`,
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
      `[social-media] Error scraping Facebook ${facebookUrl}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Scrape and save a TikTok profile
 * @param organizationProfileId - The organization profile ID to associate with
 * @param tiktokUrl - The TikTok URL or handle
 * @returns The saved social media account
 */
export async function scrapeAndSaveTiktokProfile(
  organizationProfileId: string,
  tiktokUrl: string
): Promise<SocialMediaAccountRow | null> {
  try {
    const result = await scrapeTiktokProfile(tiktokUrl);

    if (!result.success || !result.data) {
      console.error(
        `[social-media] Failed to scrape TikTok ${tiktokUrl}:`,
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
      `[social-media] Error scraping TikTok ${tiktokUrl}:`,
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
    case "facebook":
      account = await scrapeAndSaveFacebookProfile(profile.id, platformUrl);
      break;
    case "tiktok":
      account = await scrapeAndSaveTiktokProfile(profile.id, platformUrl);
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

/**
 * Extract Facebook handle from URL (re-export for router use)
 */
export { extractFacebookHandle };

/**
 * Extract TikTok handle from URL (re-export for router use)
 */
export { extractTiktokHandle };

// =============================================================================
// Instagram Posts Functions
// =============================================================================

/**
 * Upsert Instagram posts (insert new, update existing by platformPostId)
 * @param socialMediaAccountId - The social media account ID
 * @param posts - Array of Instagram posts to upsert
 * @param scrapedAt - Timestamp of when posts were scraped
 * @returns Array of upserted post records
 */
async function upsertInstagramPosts(
  socialMediaAccountId: string,
  posts: InstagramPost[],
  scrapedAt: Date
): Promise<SocialMediaPostRow[]> {
  const results: SocialMediaPostRow[] = [];

  for (const post of posts) {
    // Check if post already exists
    const existing = await db
      .select()
      .from(socialMediaPostTable)
      .where(
        and(
          eq(socialMediaPostTable.socialMediaAccountId, socialMediaAccountId),
          eq(socialMediaPostTable.platformPostId, post.platformPostId)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Update existing post
      const result = await db
        .update(socialMediaPostTable)
        .set({
          shortcode: post.shortcode,
          mediaType: post.mediaType,
          productType: post.productType,
          caption: post.caption,
          postUrl: post.postUrl,
          thumbnailUrl: post.thumbnailUrl,
          playCount: post.playCount,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          videoDuration: post.videoDuration,
          hasAudio: post.hasAudio,
          takenAt: post.takenAt,
          mediaUrls: post.mediaUrls,
          scrapedAt,
        })
        .where(eq(socialMediaPostTable.id, existing[0].id))
        .returning();

      if (result[0]) {
        results.push(result[0]);
      }
    } else {
      // Insert new post
      const result = await db
        .insert(socialMediaPostTable)
        .values({
          socialMediaAccountId,
          platformPostId: post.platformPostId,
          shortcode: post.shortcode,
          mediaType: post.mediaType,
          productType: post.productType,
          caption: post.caption,
          postUrl: post.postUrl,
          thumbnailUrl: post.thumbnailUrl,
          playCount: post.playCount,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          videoDuration: post.videoDuration,
          hasAudio: post.hasAudio,
          takenAt: post.takenAt,
          mediaUrls: post.mediaUrls,
          scrapedAt,
        })
        .returning();

      if (result[0]) {
        results.push(result[0]);
      }
    }
  }

  return results;
}

/**
 * Scrape and save Instagram posts for an account
 * @param socialMediaAccountId - The social media account ID
 * @param handle - The Instagram handle
 * @param cursor - Optional pagination cursor
 * @returns Object containing posts, pagination cursor, and hasMore flag
 */
export async function scrapeAndSaveInstagramPosts(
  socialMediaAccountId: string,
  handle: string,
  cursor?: string
): Promise<{
  posts: SocialMediaPostRow[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  try {
    const result = await scrapeInstagramPosts(handle, cursor);

    if (!result.success || !result.data) {
      console.error(
        `[social-media] Failed to scrape Instagram posts for ${handle}:`,
        result.error
      );
      return { posts: [], hasMore: false };
    }

    const posts = await upsertInstagramPosts(
      socialMediaAccountId,
      result.data,
      result.scrapedAt
    );

    return {
      posts,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error(
      `[social-media] Error scraping Instagram posts for ${handle}:`,
      error instanceof Error ? error.message : error
    );
    return { posts: [], hasMore: false };
  }
}

/**
 * Get Instagram posts for a social media account
 * @param socialMediaAccountId - The social media account ID
 * @param limit - Optional limit for number of posts to return (default: 50)
 * @returns Array of posts ordered by takenAt descending
 */
export async function getInstagramPosts(
  socialMediaAccountId: string,
  limit: number = 50
): Promise<SocialMediaPostRow[]> {
  const posts = await db
    .select()
    .from(socialMediaPostTable)
    .where(eq(socialMediaPostTable.socialMediaAccountId, socialMediaAccountId))
    .orderBy(desc(socialMediaPostTable.takenAt))
    .limit(limit);

  return posts;
}

/**
 * Get Instagram posts count for a social media account
 * @param socialMediaAccountId - The social media account ID
 * @returns Number of posts stored for the account
 */
export async function getInstagramPostsCount(
  socialMediaAccountId: string
): Promise<number> {
  const result = await db
    .select()
    .from(socialMediaPostTable)
    .where(eq(socialMediaPostTable.socialMediaAccountId, socialMediaAccountId));

  return result.length;
}

/**
 * Scrape and save an Instagram profile along with initial posts
 * This is used when setting up an Instagram profile for the first time.
 * @param organizationProfileId - The organization profile ID to associate with
 * @param instagramUrl - The Instagram URL or handle
 * @returns void - Fire and forget, logs errors internally
 */
export async function scrapeInstagramProfileAndInitialPosts(
  organizationProfileId: string,
  instagramUrl: string
): Promise<void> {
  try {
    // Step 1: Scrape and save the Instagram profile
    const account = await scrapeAndSaveInstagramProfile(
      organizationProfileId,
      instagramUrl
    );

    if (!account) {
      console.error(
        `[social-media] Failed to scrape Instagram profile ${instagramUrl}, skipping posts scraping`
      );
      return;
    }

    // Step 2: Extract handle for posts scraping
    const handle = extractInstagramHandle(instagramUrl);

    if (!handle) {
      console.error(
        `[social-media] Could not extract handle from ${instagramUrl}, skipping posts scraping`
      );
      return;
    }

    // Step 3: Scrape and save the first batch of posts (typically ~12 posts per API call)
    // We'll make up to 2 calls to get approximately 20-24 posts
    const firstBatch = await scrapeAndSaveInstagramPosts(account.id, handle);

    // If there are more posts and we got posts in the first batch, fetch another batch
    if (
      firstBatch.hasMore &&
      firstBatch.nextCursor &&
      firstBatch.posts.length > 0
    ) {
      await scrapeAndSaveInstagramPosts(
        account.id,
        handle,
        firstBatch.nextCursor
      );
    }
  } catch (error) {
    console.error(
      `[social-media] Error in scrapeInstagramProfileAndInitialPosts for ${instagramUrl}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Get Instagram posts for an organization
 * @param organizationId - The organization ID
 * @param limit - Optional limit for number of posts to return (default: 50)
 * @returns Array of posts ordered by takenAt descending, or null if no account found
 */
export async function getInstagramPostsForOrganization(
  organizationId: string,
  limit: number = 50
): Promise<SocialMediaPostRow[] | null> {
  // Get the Instagram account for this organization
  const account = await getSocialMediaAccount(organizationId, "instagram");

  if (!account) {
    return null;
  }

  return getInstagramPosts(account.id, limit);
}
