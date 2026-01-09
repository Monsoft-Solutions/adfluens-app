/**
 * Facebook Page Scraper
 *
 * Scrapes Facebook page data using ScrapeCreator API and maps
 * the response to the SocialMediaAccount type for database storage.
 *
 * @module @repo/scraper/scrapers/social-media/facebook
 */

import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { FacebookPlatformData } from "@repo/types/social-media/facebook-platform-data.type";
import type {
  ScrapecreatorFacebookPageResponse,
  ScrapecreatorFacebookCoverPhoto,
} from "@repo/types/scrapecreator/scrapecreator-facebook-page.type";

import { scrapeCreatorClient } from "../../clients/scrapecreator.client";

/**
 * Result of a Facebook scraping operation
 */
export type FacebookScrapingResult = {
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
 * Map cover photo from ScrapeCreator API response to our type
 */
function mapCoverPhoto(
  coverPhoto: ScrapecreatorFacebookCoverPhoto | undefined
): FacebookPlatformData["coverPhoto"] {
  if (!coverPhoto) return null;

  return {
    id: coverPhoto.photo?.id ?? null,
    url: coverPhoto.photo?.url ?? null,
    imageUri: coverPhoto.photo?.image?.uri ?? null,
    width: coverPhoto.photo?.image?.width ?? null,
    height: coverPhoto.photo?.image?.height ?? null,
    focusX: coverPhoto.focus?.x ?? null,
    focusY: coverPhoto.focus?.y ?? null,
  };
}

/**
 * Map ScrapeCreator Facebook API response to SocialMediaAccount type
 */
function mapScrapecreatorFacebookResponse(
  response: ScrapecreatorFacebookPageResponse
): SocialMediaAccount {
  const platformData: FacebookPlatformData = {
    platform: "facebook",
    pageUrl: response.url ?? null,
    pageIntro: response.pageIntro ?? null,
    category: response.category ?? null,
    address: response.address ?? null,
    email: response.email ?? null,
    phone: response.phone ?? null,
    website: response.website ?? null,
    priceRange: response.priceRange ?? null,
    creationDate: response.creationDate ?? null,
    gender: response.gender ?? null,
    likeCount: response.likeCount ?? null,
    ratingCount: response.ratingCount ?? null,
    isBusinessPageActive: response.isBusinessPageActive,
    coverPhoto: mapCoverPhoto(response.coverPhoto),
    adLibrary: response.adLibrary
      ? {
          adStatus: response.adLibrary.adStatus ?? null,
          pageId: response.adLibrary.pageId ?? null,
        }
      : null,
    links: response.links,
  };

  // Extract username from URL
  const username = extractFacebookHandle(response.url);

  return {
    platform: "facebook",
    platformUserId: response.id,
    username,
    displayName: response.name || null,
    bio: response.pageIntro || null,
    profilePicUrl: response.profilePicMedium || null,
    profilePicUrlHd: response.profilePicLarge || null,
    externalUrl: response.website || null,
    followerCount: response.followerCount ?? null,
    followingCount: null, // Facebook pages don't have following count
    isVerified: false, // Not provided in this API response
    isBusinessAccount: response.isBusinessPageActive ?? false,
    platformData,
  };
}

/**
 * Extract Facebook page handle/slug from URL
 * Handles various URL formats:
 * - https://facebook.com/pagename
 * - https://www.facebook.com/pagename/
 * - https://fb.com/pagename
 * - @pagename
 * - pagename
 */
export function extractFacebookHandle(urlOrHandle: string): string {
  const trimmed = urlOrHandle.trim();

  // If it's just a handle (with or without @)
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return trimmed.replace(/^@/, "");
  }

  // Try to parse as URL
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    // Get path and remove leading/trailing slashes
    const path = url.pathname.replace(/^\/|\/$/g, "");
    // Return the first path segment (the page name/slug)
    return path.split("/")[0] || "";
  } catch {
    // If URL parsing fails, try to extract from path-like string
    const match = trimmed.match(/(?:facebook|fb)\.com\/([^/?]+)/i);
    if (match?.[1]) {
      return match[1];
    }
    // Return trimmed value as fallback
    return trimmed.replace(/^@/, "");
  }
}

/**
 * Build a full Facebook URL from a handle or URL
 * If already a URL, returns it. If just a handle, builds the URL.
 */
function buildFacebookUrl(handleOrUrl: string): string {
  const trimmed = handleOrUrl.trim();

  // If it's already a full URL, return it
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.com")
  ) {
    // Ensure it has https://
    if (!trimmed.startsWith("http")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  // It's a handle, build the URL
  const handle = trimmed.replace(/^@/, "");
  return `https://www.facebook.com/${handle}/`;
}

/**
 * Scrape a Facebook page and return mapped data
 * @param handleOrUrl - Facebook page handle or full URL
 * @returns Scraping result with mapped social media account data
 */
export async function scrapeFacebookPage(
  handleOrUrl: string
): Promise<FacebookScrapingResult> {
  const scrapedAt = new Date();

  try {
    const facebookUrl = buildFacebookUrl(handleOrUrl);

    if (!facebookUrl) {
      return {
        success: false,
        error: "Invalid Facebook handle or URL",
        scrapedAt,
      };
    }

    const response =
      await scrapeCreatorClient.scrapeFacebookProfile(facebookUrl);

    if (!response.success || !response.id) {
      return {
        success: false,
        error: "Failed to retrieve Facebook page data",
        scrapedAt,
      };
    }

    const data = mapScrapecreatorFacebookResponse(response);

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
      error: `Failed to scrape Facebook page: ${errorMessage}`,
      scrapedAt,
    };
  }
}
