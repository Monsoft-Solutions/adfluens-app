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
  count,
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
  scrapeTiktokPosts,
} from "@monsoft/scraper";
import { mediaStorage } from "@repo/media-storage";
import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { SocialMediaPlatform } from "@repo/types/social-media/social-media-platform.enum";
import type { InstagramPost } from "@repo/types/social-media/instagram-post.type";
import type { TiktokPost } from "@repo/types/social-media/tiktok-post.type";

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
 * Uses atomic onConflictDoUpdate to prevent race conditions
 */
async function upsertSocialMediaAccount(
  organizationProfileId: string,
  data: SocialMediaAccount,
  scrapedAt: Date
): Promise<SocialMediaAccountRow> {
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
    .onConflictDoUpdate({
      target: [
        socialMediaAccountTable.organizationProfileId,
        socialMediaAccountTable.platform,
      ],
      set: {
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
      },
    })
    .returning();

  if (!result[0]) {
    throw new Error("Failed to upsert social media account");
  }

  return result[0];
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
 * Process post media by uploading to Google Cloud Storage
 * @param post - The Instagram post to process
 * @param accountHandle - The Instagram account handle
 * @returns The post with updated media URLs
 */
async function processPostMedia(
  post: InstagramPost,
  accountHandle: string
): Promise<InstagramPost> {
  const processedPost = { ...post };
  // Use a clean folder structure: instagram/handle/posts/shortcode
  const folder = `instagram/${accountHandle}/posts/${post.shortcode}`;

  // Process thumbnail - only store GCS URLs, never original
  if (post.thumbnailUrl) {
    try {
      const storedUrl = await mediaStorage.uploadFromUrl(
        post.thumbnailUrl,
        folder,
        "thumbnail.jpg"
      );
      processedPost.originalThumbnailUrl = post.thumbnailUrl;
      processedPost.thumbnailUrl = storedUrl;
    } catch (error) {
      console.warn(
        `[social-media] Failed to upload thumbnail for post ${post.shortcode}:`,
        error
      );
      // Set to null on failure - we MUST NOT use original URLs
      processedPost.originalThumbnailUrl = post.thumbnailUrl;
      processedPost.thumbnailUrl = null;
    }
  }

  // Process media URLs
  if (post.mediaUrls && post.mediaUrls.length > 0) {
    const processedMediaUrls: typeof post.mediaUrls = [];

    for (let i = 0; i < post.mediaUrls.length; i++) {
      const media = post.mediaUrls[i];
      if (!media) continue;

      try {
        // Determine extension based on type, fallback to jpg/mp4
        const extension = media.type === "video" ? "mp4" : "jpg";
        const filename = `media_${i}.${extension}`;

        const storedUrl = await mediaStorage.uploadFromUrl(
          media.url,
          folder,
          filename
        );

        processedMediaUrls.push({
          ...media,
          url: storedUrl,
          originalUrl: media.url,
        });
      } catch (error) {
        console.warn(
          `[social-media] Failed to upload media ${i} for post ${post.shortcode}:`,
          error
        );
        // Skip media if upload fails - we MUST NOT use original URLs
        // Only store originalUrl for reference, but don't include in processed list
      }
    }

    processedPost.mediaUrls = processedMediaUrls;
  }

  return processedPost;
}

/**
 * Upsert Instagram posts (insert new, update existing by platformPostId)
 * Uses atomic onConflictDoUpdate to prevent race conditions
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
  if (posts.length === 0) {
    return [];
  }

  const results: SocialMediaPostRow[] = [];

  // Process posts in batches using atomic upserts
  for (const post of posts) {
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
        originalThumbnailUrl: post.originalThumbnailUrl,
        playCount: post.playCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        videoDuration: post.videoDuration,
        hasAudio: post.hasAudio,
        takenAt: post.takenAt,
        mediaUrls: post.mediaUrls,
        scrapedAt,
      })
      .onConflictDoUpdate({
        target: [
          socialMediaPostTable.socialMediaAccountId,
          socialMediaPostTable.platformPostId,
        ],
        set: {
          shortcode: post.shortcode,
          mediaType: post.mediaType,
          productType: post.productType,
          caption: post.caption,
          postUrl: post.postUrl,
          thumbnailUrl: post.thumbnailUrl,
          originalThumbnailUrl: post.originalThumbnailUrl,
          playCount: post.playCount,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          videoDuration: post.videoDuration,
          hasAudio: post.hasAudio,
          takenAt: post.takenAt,
          mediaUrls: post.mediaUrls,
          scrapedAt,
        },
      })
      .returning();

    if (result[0]) {
      results.push(result[0]);
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

    // Process posts to upload media to GCS
    // We process sequentially to avoid overwhelming the network or rate limits
    const processedPosts: InstagramPost[] = [];
    for (const post of result.data) {
      const processed = await processPostMedia(post, handle);
      processedPosts.push(processed);
    }

    const posts = await upsertInstagramPosts(
      socialMediaAccountId,
      processedPosts,
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
 * Uses efficient SQL count instead of fetching all rows
 * @param socialMediaAccountId - The social media account ID
 * @returns Number of posts stored for the account
 */
export async function getInstagramPostsCount(
  socialMediaAccountId: string
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(socialMediaPostTable)
    .where(eq(socialMediaPostTable.socialMediaAccountId, socialMediaAccountId));

  return result[0]?.count ?? 0;
}

/**
 * Maximum number of pagination batches to fetch during initial setup
 * This prevents runaway pagination and excessive API calls
 */
const MAX_INITIAL_PAGINATION_BATCHES = 3;

/**
 * Scrape and save an Instagram profile along with initial posts
 * This is used when setting up an Instagram profile for the first time.
 * Uses pagination safeguards to prevent excessive API calls
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

    // Step 3: Scrape posts with pagination safeguards
    let batchCount = 0;
    let cursor: string | undefined;

    while (batchCount < MAX_INITIAL_PAGINATION_BATCHES) {
      const batch = await scrapeAndSaveInstagramPosts(
        account.id,
        handle,
        cursor
      );
      batchCount++;

      // Stop if no more posts or pagination ended
      if (!batch.hasMore || !batch.nextCursor || batch.posts.length === 0) {
        break;
      }

      cursor = batch.nextCursor;
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

// =============================================================================
// TikTok Posts Functions
// =============================================================================

/**
 * Process TikTok post media by uploading cover image and video to Google Cloud Storage
 * @param post - The TikTok post to process
 * @param accountHandle - The TikTok account handle
 * @returns The post with updated media URLs
 */
async function processTiktokPostMedia(
  post: TiktokPost,
  accountHandle: string
): Promise<TiktokPost> {
  const processedPost = { ...post };
  // Use a clean folder structure: tiktok/handle/posts/aweme_id
  const folder = `tiktok/${accountHandle}/posts/${post.shortcode}`;

  // Process thumbnail/cover image - only store GCS URLs, never original
  if (post.thumbnailUrl) {
    try {
      const storedUrl = await mediaStorage.uploadFromUrl(
        post.thumbnailUrl,
        folder,
        "thumbnail.jpg"
      );
      processedPost.originalThumbnailUrl = post.thumbnailUrl;
      processedPost.thumbnailUrl = storedUrl;
    } catch (error) {
      console.warn(
        `[social-media] Failed to upload thumbnail for TikTok post ${post.shortcode}:`,
        error
      );
      // Set to null on failure - we MUST NOT use original URLs
      processedPost.originalThumbnailUrl = post.thumbnailUrl;
      processedPost.thumbnailUrl = null;
    }
  }

  // Process video - only store GCS URLs, never original
  if (post.videoUrl) {
    try {
      const storedUrl = await mediaStorage.uploadFromUrl(
        post.videoUrl,
        folder,
        "video.mp4"
      );
      processedPost.originalVideoUrl = post.videoUrl;
      processedPost.videoUrl = storedUrl;
    } catch (error) {
      console.warn(
        `[social-media] Failed to upload video for TikTok post ${post.shortcode}:`,
        error
      );
      // Set to null on failure - we MUST NOT use original URLs
      processedPost.originalVideoUrl = post.videoUrl;
      processedPost.videoUrl = null;
    }
  }

  return processedPost;
}

/**
 * Build media URLs array for TikTok post (video)
 * Returns null if no video URL is available
 */
function buildTiktokMediaUrls(post: TiktokPost) {
  if (!post.videoUrl) {
    return null;
  }

  return [
    {
      url: post.videoUrl,
      originalUrl: post.originalVideoUrl ?? undefined,
      width: post.videoWidth ?? 0,
      height: post.videoHeight ?? 0,
      type: "video" as const,
    },
  ];
}

/**
 * Upsert TikTok posts (insert new, update existing by platformPostId)
 * Uses atomic onConflictDoUpdate to prevent race conditions
 * @param socialMediaAccountId - The social media account ID
 * @param posts - Array of TikTok posts to upsert
 * @param scrapedAt - Timestamp of when posts were scraped
 * @returns Array of upserted post records
 */
async function upsertTiktokPosts(
  socialMediaAccountId: string,
  posts: TiktokPost[],
  scrapedAt: Date
): Promise<SocialMediaPostRow[]> {
  if (posts.length === 0) {
    return [];
  }

  const results: SocialMediaPostRow[] = [];

  // Process posts using atomic upserts
  for (const post of posts) {
    // Build media URLs array for this post
    const mediaUrls = buildTiktokMediaUrls(post);

    const result = await db
      .insert(socialMediaPostTable)
      .values({
        socialMediaAccountId,
        platformPostId: post.platformPostId,
        shortcode: post.shortcode,
        mediaType: "video", // All TikTok posts are videos
        productType: null,
        caption: post.caption,
        postUrl: post.postUrl,
        thumbnailUrl: post.thumbnailUrl,
        originalThumbnailUrl: post.originalThumbnailUrl,
        playCount: post.playCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        videoDuration: post.videoDuration,
        hasAudio: true, // TikTok videos have audio by default
        takenAt: post.takenAt,
        mediaUrls,
        scrapedAt,
      })
      .onConflictDoUpdate({
        target: [
          socialMediaPostTable.socialMediaAccountId,
          socialMediaPostTable.platformPostId,
        ],
        set: {
          shortcode: post.shortcode,
          mediaType: "video",
          productType: null,
          caption: post.caption,
          postUrl: post.postUrl,
          thumbnailUrl: post.thumbnailUrl,
          originalThumbnailUrl: post.originalThumbnailUrl,
          playCount: post.playCount,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          videoDuration: post.videoDuration,
          hasAudio: true,
          takenAt: post.takenAt,
          mediaUrls,
          scrapedAt,
        },
      })
      .returning();

    if (result[0]) {
      results.push(result[0]);
    }
  }

  return results;
}

/**
 * Scrape and save TikTok posts for an account
 * @param socialMediaAccountId - The social media account ID
 * @param handle - The TikTok handle
 * @param cursor - Optional pagination cursor
 * @returns Object containing posts, pagination cursor, and hasMore flag
 */
export async function scrapeAndSaveTiktokPosts(
  socialMediaAccountId: string,
  handle: string,
  cursor?: number
): Promise<{
  posts: SocialMediaPostRow[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  try {
    const result = await scrapeTiktokPosts(handle, cursor);

    if (!result.success || !result.data) {
      console.error(
        `[social-media] Failed to scrape TikTok posts for ${handle}:`,
        result.error
      );
      return { posts: [], hasMore: false };
    }

    // Process posts to upload cover images to GCS
    // We process sequentially to avoid overwhelming the network or rate limits
    const processedPosts: TiktokPost[] = [];
    for (const post of result.data) {
      const processed = await processTiktokPostMedia(post, handle);
      processedPosts.push(processed);
    }

    const posts = await upsertTiktokPosts(
      socialMediaAccountId,
      processedPosts,
      result.scrapedAt
    );

    return {
      posts,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error(
      `[social-media] Error scraping TikTok posts for ${handle}:`,
      error instanceof Error ? error.message : error
    );
    return { posts: [], hasMore: false };
  }
}

/**
 * Get TikTok posts for a social media account
 * @param socialMediaAccountId - The social media account ID
 * @param limit - Optional limit for number of posts to return (default: 50)
 * @returns Array of posts ordered by takenAt descending
 */
export async function getTiktokPosts(
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
 * Scrape and save a TikTok profile along with initial posts
 * This is used when setting up a TikTok profile for the first time.
 * Uses pagination safeguards to prevent excessive API calls
 * @param organizationProfileId - The organization profile ID to associate with
 * @param tiktokUrl - The TikTok URL or handle
 * @returns void - Fire and forget, logs errors internally
 */
export async function scrapeTiktokProfileAndInitialPosts(
  organizationProfileId: string,
  tiktokUrl: string
): Promise<void> {
  try {
    // Step 1: Scrape and save the TikTok profile
    const account = await scrapeAndSaveTiktokProfile(
      organizationProfileId,
      tiktokUrl
    );

    if (!account) {
      console.error(
        `[social-media] Failed to scrape TikTok profile ${tiktokUrl}, skipping posts scraping`
      );
      return;
    }

    // Step 2: Extract handle for posts scraping
    const handle = extractTiktokHandle(tiktokUrl);

    if (!handle) {
      console.error(
        `[social-media] Could not extract handle from ${tiktokUrl}, skipping posts scraping`
      );
      return;
    }

    // Step 3: Scrape posts with pagination safeguards
    let batchCount = 0;
    let cursor: number | undefined;

    while (batchCount < MAX_INITIAL_PAGINATION_BATCHES) {
      const batch = await scrapeAndSaveTiktokPosts(account.id, handle, cursor);
      batchCount++;

      // Stop if no more posts or pagination ended
      if (!batch.hasMore || !batch.nextCursor || batch.posts.length === 0) {
        break;
      }

      cursor = batch.nextCursor;
    }
  } catch (error) {
    console.error(
      `[social-media] Error in scrapeTiktokProfileAndInitialPosts for ${tiktokUrl}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Get TikTok posts for an organization
 * @param organizationId - The organization ID
 * @param limit - Optional limit for number of posts to return (default: 50)
 * @returns Array of posts ordered by takenAt descending, or null if no account found
 */
export async function getTiktokPostsForOrganization(
  organizationId: string,
  limit: number = 50
): Promise<SocialMediaPostRow[] | null> {
  // Get the TikTok account for this organization
  const account = await getSocialMediaAccount(organizationId, "tiktok");

  if (!account) {
    return null;
  }

  return getTiktokPosts(account.id, limit);
}
