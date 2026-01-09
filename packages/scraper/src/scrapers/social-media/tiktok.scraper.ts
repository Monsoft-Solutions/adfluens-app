/**
 * TikTok Profile Scraper
 *
 * Scrapes TikTok profile data using ScrapeCreator API and maps
 * the response to the SocialMediaAccount type for database storage.
 *
 * @module @repo/scraper/scrapers/social-media/tiktok
 */

import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { TikTokPlatformData } from "@repo/types/social-media/tiktok-platform-data.type";
import type { ScrapecreatorTiktokProfileResponse } from "@repo/types/scrapecreator/scrapecreator-tiktok-profile.type";

import { scrapeCreatorClient } from "../../clients/scrapecreator.client";

/**
 * Result of a TikTok scraping operation
 */
export type TiktokScrapingResult = {
  /** Whether the scraping was successful */
  success: boolean;

  /** The mapped social media account data */
  data?: SocialMediaAccount;

  /** Error message if scraping failed */
  error?: string;

  /** Timestamp of when the scraping occurred */
  scrapedAt: Date;
};

/**
 * Map ScrapeCreator TikTok API response to SocialMediaAccount type
 */
function mapScrapecreatorTiktokResponse(
  response: ScrapecreatorTiktokProfileResponse
): SocialMediaAccount {
  const { user, stats } = response;

  const platformData: TikTokPlatformData = {
    platform: "tiktok",
    shortId: user.shortId || null,
    secUid: user.secUid || null,
    heartCount: stats.heartCount ?? null,
    videoCount: stats.videoCount ?? null,
    diggCount: stats.diggCount ?? null,
    friendCount: stats.friendCount ?? null,
    commerceUserInfo: user.commerceUserInfo
      ? {
          commerceUser: user.commerceUserInfo.commerceUser,
          category: user.commerceUserInfo.category ?? null,
          categoryButton: user.commerceUserInfo.categoryButton,
        }
      : null,
    profileTab: user.profileTab
      ? {
          showMusicTab: user.profileTab.showMusicTab,
          showQuestionTab: user.profileTab.showQuestionTab,
          showPlayListTab: user.profileTab.showPlayListTab,
        }
      : null,
    privateAccount: user.privateAccount,
    isOrganization: user.isOrganization === 1,
    language: user.language ?? null,
    createTime: user.createTime ?? null,
    ttSeller: user.ttSeller,
    duetSetting: user.duetSetting ?? null,
    stitchSetting: user.stitchSetting ?? null,
    downloadSetting: user.downloadSetting ?? null,
  };

  return {
    platform: "tiktok",
    platformUserId: user.id,
    username: user.uniqueId,
    displayName: user.nickname || null,
    bio: user.signature || null,
    profilePicUrl: user.avatarMedium || null,
    profilePicUrlHd: user.avatarLarger || null,
    externalUrl: null, // TikTok profiles don't have external URLs in this API
    followerCount: stats.followerCount ?? null,
    followingCount: stats.followingCount ?? null,
    isVerified: user.verified ?? false,
    isBusinessAccount: user.commerceUserInfo?.commerceUser ?? false,
    platformData,
  };
}

/**
 * TikTok handle validation regex
 * - 2-24 characters
 * - Letters, numbers, underscores, periods only
 * - Cannot start or end with period
 */
const TIKTOK_HANDLE_REGEX =
  /^[a-zA-Z0-9_][a-zA-Z0-9_.]{0,22}[a-zA-Z0-9_]$|^[a-zA-Z0-9_]$/;

/**
 * Validate a TikTok handle format
 */
function isValidTiktokHandle(handle: string): boolean {
  if (!handle || handle.length === 0 || handle.length > 24) {
    return false;
  }
  // Check for consecutive periods
  if (handle.includes("..")) {
    return false;
  }
  return TIKTOK_HANDLE_REGEX.test(handle);
}

/**
 * Extract TikTok username/handle from URL or handle string
 * Handles various formats:
 * - https://tiktok.com/@username
 * - https://www.tiktok.com/@username
 * - https://tiktok.com/@username/video/123
 * - @username
 * - username
 *
 * Returns null if the extracted handle is invalid
 */
export function extractTiktokHandle(urlOrHandle: string): string | null {
  const trimmed = urlOrHandle.trim();

  let handle: string;

  // If it's just a handle (with or without @)
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    handle = trimmed.replace(/^@/, "");
  } else {
    // Try to parse as URL
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
      );

      // Get path and find the @username part
      const pathParts = url.pathname.split("/").filter(Boolean);

      // Find the part that starts with @ or is the first path segment
      let foundHandle = "";
      for (const part of pathParts) {
        if (part.startsWith("@")) {
          foundHandle = part.substring(1); // Remove the @ prefix
          break;
        }
      }

      // If no @ prefix found, return the first path segment
      if (!foundHandle && pathParts[0]) {
        foundHandle = pathParts[0].replace(/^@/, "");
      }

      handle = foundHandle;
    } catch {
      // If URL parsing fails, try to extract from path-like string
      const match = trimmed.match(/tiktok\.com\/@?([^/?]+)/i);
      if (match?.[1]) {
        handle = match[1].replace(/^@/, "");
      } else {
        // Return trimmed value as fallback (removing @ if present)
        handle = trimmed.replace(/^@/, "");
      }
    }
  }

  // Validate the extracted handle
  if (!isValidTiktokHandle(handle)) {
    return null;
  }

  return handle;
}

/**
 * Scrape a TikTok profile and return mapped data
 * @param handleOrUrl - TikTok username/handle or full URL
 * @returns Scraping result with mapped social media account data
 */
export async function scrapeTiktokProfile(
  handleOrUrl: string
): Promise<TiktokScrapingResult> {
  const scrapedAt = new Date();

  try {
    const handle = extractTiktokHandle(handleOrUrl);

    if (!handle) {
      return {
        success: false,
        error: "Invalid TikTok handle or URL",
        scrapedAt,
      };
    }

    const response = await scrapeCreatorClient.scrapeTiktokProfile(handle);

    if (!response.success || !response.user?.id) {
      return {
        success: false,
        error: "Failed to retrieve TikTok profile data",
        scrapedAt,
      };
    }

    const data = mapScrapecreatorTiktokResponse(response);

    return {
      success: true,
      data,
      scrapedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: `Failed to scrape TikTok profile: ${errorMessage}`,
      scrapedAt,
    };
  }
}
