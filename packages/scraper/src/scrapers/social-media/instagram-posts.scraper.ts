/**
 * Instagram Posts Scraper
 *
 * Scrapes Instagram posts data using ScrapeCreator API v2 and maps
 * the response to the InstagramPost type for database storage.
 *
 * @module @repo/scraper/scrapers/social-media/instagram-posts
 */

import type {
  InstagramPost,
  InstagramPostMedia,
  InstagramPostMediaType,
  InstagramProductType,
} from "@repo/types/social-media/instagram-post.type";
import type {
  ScrapecreatorInstagramPost,
  ScrapecreatorInstagramVideoVersion,
  ScrapecreatorInstagramImageCandidate,
} from "@repo/types/scrapecreator/scrapecreator-instagram-posts.type";

import { scrapeCreatorClient } from "../../clients/scrapecreator.client";

/**
 * Result of an Instagram posts scraping operation
 */
export type InstagramPostsScrapingResult = {
  /** Whether the scraping was successful */
  success: boolean;

  /** Array of mapped Instagram posts */
  data?: InstagramPost[];

  /** Cursor for fetching the next page of posts */
  nextCursor?: string;

  /** Whether more posts are available */
  hasMore: boolean;

  /** Error message if scraping failed */
  error?: string;

  /** Timestamp of when the scraping occurred */
  scrapedAt: Date;
};

/**
 * Map Instagram media type number to our enum
 * - 1: Image/Photo
 * - 2: Video/Reel
 * - 8: Carousel
 */
function mapMediaType(mediaType: number): InstagramPostMediaType {
  switch (mediaType) {
    case 1:
      return "image";
    case 2:
      return "video";
    case 8:
      return "carousel";
    default:
      return "image";
  }
}

/**
 * Map Instagram product type to our enum
 */
function mapProductType(productType: string): InstagramProductType | null {
  switch (productType) {
    case "clips":
      return "clips";
    case "feed":
      return "feed";
    default:
      return null;
  }
}

/**
 * Map video versions to our media format
 * Selects the best quality video URL available
 */
function mapVideoVersions(
  versions: ScrapecreatorInstagramVideoVersion[] | undefined
): InstagramPostMedia[] {
  if (!versions || versions.length === 0) return [];

  // Sort by height (quality) descending and take the best one
  const sorted = [...versions].sort((a, b) => b.height - a.height);
  const best = sorted[0];

  if (!best) return [];

  return [
    {
      url: best.url,
      width: best.width,
      height: best.height,
      type: "video",
    },
  ];
}

/**
 * Map image candidates to our media format
 * Selects a good quality image (around 1080px if available)
 */
function mapImageCandidates(
  candidates: ScrapecreatorInstagramImageCandidate[] | undefined
): InstagramPostMedia[] {
  if (!candidates || candidates.length === 0) return [];

  // Find an image close to 1080px width, or the largest available
  const targetWidth = 1080;
  const sorted = [...candidates].sort((a, b) => {
    const diffA = Math.abs(a.width - targetWidth);
    const diffB = Math.abs(b.width - targetWidth);
    return diffA - diffB;
  });

  const best = sorted[0];

  if (!best) return [];

  return [
    {
      url: best.url,
      width: best.width,
      height: best.height,
      type: "image",
    },
  ];
}

/**
 * Map a single ScrapeCreator post to our InstagramPost type
 */
function mapScrapecreatorPost(post: ScrapecreatorInstagramPost): InstagramPost {
  const mediaType = mapMediaType(post.media_type);
  const productType = mapProductType(post.product_type);

  // Build media URLs array based on media type
  let mediaUrls: InstagramPostMedia[] = [];

  if (mediaType === "video" && post.video_versions) {
    mediaUrls = mapVideoVersions(post.video_versions);
  }

  // Always try to add image candidates (thumbnails for videos, images for photos)
  const imageCandidates = mapImageCandidates(post.image_versions2?.candidates);

  if (mediaType !== "video") {
    mediaUrls = imageCandidates;
  } else if (imageCandidates.length > 0 && mediaUrls.length > 0) {
    // For videos, add the thumbnail as an additional media item
    mediaUrls.push({
      ...imageCandidates[0]!,
      type: "image",
    });
  }

  return {
    platformPostId: post.id,
    shortcode: post.code,
    mediaType,
    productType,
    caption: post.caption?.text ?? null,
    postUrl: post.url,
    thumbnailUrl: post.display_uri,
    playCount: post.play_count ?? null,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    videoDuration: post.video_duration ?? null,
    hasAudio: post.has_audio ?? null,
    takenAt: new Date(post.taken_at * 1000), // Convert Unix timestamp to Date
    mediaUrls,
  };
}

/**
 * Scrape Instagram posts for a user and return mapped data
 * @param handleOrUrl - Instagram handle or profile URL
 * @param cursor - Optional pagination cursor for fetching more posts
 * @returns Scraping result with mapped posts and pagination info
 */
export async function scrapeInstagramPosts(
  handleOrUrl: string,
  cursor?: string
): Promise<InstagramPostsScrapingResult> {
  const scrapedAt = new Date();

  try {
    const handle = extractInstagramHandle(handleOrUrl);

    if (!handle) {
      return {
        success: false,
        hasMore: false,
        error: "Invalid Instagram handle or URL",
        scrapedAt,
      };
    }

    const response = await scrapeCreatorClient.scrapeInstagramPosts(
      handle,
      cursor
    );

    if (!response.success || !response.items) {
      return {
        success: false,
        hasMore: false,
        error: "Failed to retrieve Instagram posts data",
        scrapedAt,
      };
    }

    const data = response.items.map(mapScrapecreatorPost);

    return {
      success: true,
      data,
      nextCursor: response.next_max_id,
      hasMore: response.more_available,
      scrapedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      hasMore: false,
      error: `Failed to scrape Instagram posts: ${errorMessage}`,
      scrapedAt,
    };
  }
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
