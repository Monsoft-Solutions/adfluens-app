/**
 * Instagram Profile Scraper
 *
 * Scrapes Instagram profile data using ScrapeCreator API and maps
 * the response to the SocialMediaAccount type for database storage.
 *
 * @module @repo/scraper/scrapers/social-media/instagram
 */

import type { SocialMediaAccount } from "@repo/types/social-media/social-media-account.type";
import type { InstagramPlatformData } from "@repo/types/social-media/instagram-platform-data.type";
import type {
  ScrapecreatorInstagramUser,
  ScrapecreatorInstagramBioLink,
  ScrapecreatorInstagramBusinessAddress,
} from "@repo/types/scrapecreator/scrapecreator-instagram-profile.type";

import { scrapeCreatorClient } from "../../clients/scrapecreator.client";

/**
 * Result of an Instagram scraping operation
 */
export type InstagramScrapingResult = {
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
 * Map business address from ScrapeCreator API response to our type
 */
function mapBusinessAddress(
  address: ScrapecreatorInstagramBusinessAddress | undefined
): InstagramPlatformData["businessAddress"] {
  if (!address) return null;

  return {
    cityName: address.city_name ?? null,
    cityId: address.city_id ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    streetAddress: address.street_address ?? null,
    zipCode: address.zip_code ?? null,
  };
}

/**
 * Map bio links from ScrapeCreator API response to our type
 */
function mapBioLinks(
  links: ScrapecreatorInstagramBioLink[] | undefined
): InstagramPlatformData["bioLinks"] {
  if (!links || links.length === 0) return undefined;

  return links.map((link) => ({
    title: link.title,
    url: link.url,
    lynxUrl: link.lynx_url,
    linkType: link.link_type,
  }));
}

/**
 * Map ScrapeCreator Instagram API response to SocialMediaAccount type
 */
function mapScrapecreatorInstagramResponse(
  user: ScrapecreatorInstagramUser
): SocialMediaAccount {
  const platformData: InstagramPlatformData = {
    platform: "instagram",
    fbid: user.fbid ?? null,
    categoryName: user.category_name ?? null,
    businessAddress: mapBusinessAddress(user.business_address_json),
    bioLinks: mapBioLinks(user.bio_links),
    postsCount: user.edge_owner_to_timeline_media?.count ?? null,
    reelsCount: user.edge_felix_video_timeline?.count ?? null,
    isPrivate: user.is_private,
    isProfessionalAccount: user.is_professional_account,
    profilePicUrlHd: user.profile_pic_url_hd ?? null,
  };

  return {
    platform: "instagram",
    platformUserId: user.id,
    username: user.username,
    displayName: user.full_name || null,
    bio: user.biography || null,
    profilePicUrl: user.profile_pic_url || null,
    profilePicUrlHd: user.profile_pic_url_hd || null,
    externalUrl: user.external_url || null,
    followerCount: user.edge_followed_by?.count ?? null,
    followingCount: user.edge_follow?.count ?? null,
    isVerified: user.is_verified ?? false,
    isBusinessAccount: user.is_business_account ?? false,
    platformData,
  };
}

/**
 * Extract Instagram handle from URL
 * Handles various URL formats:
 * - https://instagram.com/username
 * - https://www.instagram.com/username/
 * - @username
 * - username
 */
export function extractInstagramHandle(urlOrHandle: string): string {
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
    // Return the first path segment (the username)
    return path.split("/")[0] || "";
  } catch {
    // If URL parsing fails, try to extract from path-like string
    const match = trimmed.match(/instagram\.com\/([^/?]+)/i);
    if (match?.[1]) {
      return match[1];
    }
    // Return trimmed value as fallback
    return trimmed.replace(/^@/, "");
  }
}

/**
 * Scrape an Instagram profile and return mapped data
 * @param handleOrUrl - Instagram handle or profile URL
 * @returns Scraping result with mapped social media account data
 */
export async function scrapeInstagramProfile(
  handleOrUrl: string
): Promise<InstagramScrapingResult> {
  const scrapedAt = new Date();

  try {
    const handle = extractInstagramHandle(handleOrUrl);

    if (!handle) {
      return {
        success: false,
        error: "Invalid Instagram handle or URL",
        scrapedAt,
      };
    }

    const response = await scrapeCreatorClient.scrapeInstagramProfile(handle);

    if (!response.success || !response.data?.user) {
      return {
        success: false,
        error: "Failed to retrieve Instagram profile data",
        scrapedAt,
      };
    }

    const data = mapScrapecreatorInstagramResponse(response.data.user);

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
      error: `Failed to scrape Instagram profile: ${errorMessage}`,
      scrapedAt,
    };
  }
}
