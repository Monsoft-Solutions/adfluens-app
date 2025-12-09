/**
 * TikTok Posts Scraper
 *
 * Scrapes TikTok posts data using ScrapeCreator API v3 and maps
 * the response to the TiktokPost type for database storage.
 *
 * @module @repo/scraper/scrapers/social-media/tiktok-posts
 */

import type { TiktokPost } from "@repo/types/social-media/tiktok-post.type";
import type { ScrapecreatorTiktokPost } from "@repo/types/scrapecreator/scrapecreator-tiktok-posts.type";

import { scrapeCreatorClient } from "../../clients/scrapecreator.client";
import { extractTiktokHandle } from "./tiktok.scraper";

/**
 * Result of a TikTok posts scraping operation
 */
export type TiktokPostsScrapingResult = {
  /** Whether the scraping was successful */
  success: boolean;

  /** Array of mapped TikTok posts */
  data?: TiktokPost[];

  /** Cursor for fetching the next page of posts */
  nextCursor?: number;

  /** Whether more posts are available */
  hasMore: boolean;

  /** Error message if scraping failed */
  error?: string;

  /** Timestamp of when the scraping occurred */
  scrapedAt: Date;
};

/**
 * Map a single ScrapeCreator TikTok post to our TiktokPost type
 */
function mapScrapecreatorTiktokPost(post: ScrapecreatorTiktokPost): TiktokPost {
  // Get the first cover URL from the video object
  const thumbnailUrl =
    post.video?.cover?.url_list?.[0] ||
    post.video?.origin_cover?.url_list?.[0] ||
    "";

  // Get video URL - prefer download_addr (no watermark) over play_addr
  const videoUrl =
    post.video?.download_addr?.url_list?.[0] ||
    post.video?.play_addr?.url_list?.[0] ||
    null;

  // Convert video duration from milliseconds to seconds
  const videoDurationSeconds = post.video?.duration
    ? post.video.duration / 1000
    : null;

  return {
    platformPostId: post.aweme_id,
    shortcode: post.aweme_id, // TikTok uses aweme_id as the identifier in URLs
    caption: post.desc || null,
    postUrl: post.url,
    thumbnailUrl,
    videoUrl,
    playCount: post.statistics?.play_count ?? null,
    likeCount: post.statistics?.digg_count ?? 0,
    commentCount: post.statistics?.comment_count ?? 0,
    shareCount: post.statistics?.share_count ?? 0,
    collectCount: post.statistics?.collect_count ?? null,
    videoDuration: videoDurationSeconds,
    videoWidth: post.video?.width ?? null,
    videoHeight: post.video?.height ?? null,
    takenAt: new Date(post.create_time * 1000), // Convert Unix timestamp to Date
    region: post.region ?? null,
    descLanguage: post.desc_language ?? null,
  };
}

/**
 * Scrape TikTok posts for a user and return mapped data
 * @param handleOrUrl - TikTok handle or profile URL
 * @param cursor - Optional pagination cursor for fetching more posts
 * @returns Scraping result with mapped posts and pagination info
 */
export async function scrapeTiktokPosts(
  handleOrUrl: string,
  cursor?: number
): Promise<TiktokPostsScrapingResult> {
  const scrapedAt = new Date();

  try {
    const handle = extractTiktokHandle(handleOrUrl);

    if (!handle) {
      return {
        success: false,
        hasMore: false,
        error: "Invalid TikTok handle or URL",
        scrapedAt,
      };
    }

    const response = await scrapeCreatorClient.scrapeTiktokPosts(
      handle,
      cursor
    );

    if (!response.success || !response.aweme_list) {
      return {
        success: false,
        hasMore: false,
        error: "Failed to retrieve TikTok posts data",
        scrapedAt,
      };
    }

    const data = response.aweme_list.map(mapScrapecreatorTiktokPost);

    return {
      success: true,
      data,
      nextCursor: response.has_more === 1 ? response.max_cursor : undefined,
      hasMore: response.has_more === 1,
      scrapedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      hasMore: false,
      error: `Failed to scrape TikTok posts: ${errorMessage}`,
      scrapedAt,
    };
  }
}
