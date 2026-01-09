/**
 * ScrapeCreator TikTok Posts API Response Types
 *
 * Types for the TikTok profile videos endpoint from the ScrapeCreator API v3.
 * These types represent the raw API response structure.
 *
 * @see https://api.scrapecreators.com/v3/tiktok/profile/videos
 * @module @repo/types/scrapecreator/scrapecreator-tiktok-posts
 */

/**
 * TikTok post statistics
 */
export type ScrapecreatorTiktokPostStatistics = {
  /** Post ID */
  aweme_id: string;

  /** Number of comments */
  comment_count: number;

  /** Number of likes (digg = like in TikTok) */
  digg_count: number;

  /** Number of downloads */
  download_count: number;

  /** Number of plays/views */
  play_count: number;

  /** Number of shares */
  share_count: number;

  /** Number of forwards */
  forward_count: number;

  /** Number of saves/collects */
  collect_count: number;

  /** Number of reposts */
  repost_count: number;

  /** WhatsApp share count */
  whatsapp_share_count: number;
};

/**
 * TikTok media URL info (for covers, videos, etc.)
 */
export type ScrapecreatorTiktokMediaUrl = {
  /** Media URI identifier */
  uri: string;

  /** Array of URL options */
  url_list: string[];

  /** Media width in pixels */
  width: number;

  /** Media height in pixels */
  height: number;

  /** Data size in bytes (may be 0) */
  data_size: number;

  /** URL prefix (usually null) */
  url_prefix: string | null;
};

/**
 * TikTok video play address with additional metadata
 */
export type ScrapecreatorTiktokPlayAddr = ScrapecreatorTiktokMediaUrl & {
  /** URL key identifier */
  url_key: string;

  /** File hash */
  file_hash: string;

  /** File checksum */
  file_cs: string;
};

/**
 * TikTok video information
 */
export type ScrapecreatorTiktokVideo = {
  /** Play address URLs */
  play_addr: ScrapecreatorTiktokPlayAddr;

  /** Cover image */
  cover: ScrapecreatorTiktokMediaUrl;

  /** Video height in pixels */
  height: number;

  /** Video width in pixels */
  width: number;

  /** Dynamic cover (animated) */
  dynamic_cover: ScrapecreatorTiktokMediaUrl;

  /** Origin cover image */
  origin_cover: ScrapecreatorTiktokMediaUrl;

  /** Video ratio/quality (e.g., "720p") */
  ratio: string;

  /** Download address URLs */
  download_addr: ScrapecreatorTiktokPlayAddr;

  /** Whether video has watermark */
  has_watermark: boolean;

  /** Video duration in milliseconds */
  duration: number;

  /** H264 play address */
  play_addr_h264?: ScrapecreatorTiktokPlayAddr;

  /** ByteVC1 play address */
  play_addr_bytevc1?: ScrapecreatorTiktokPlayAddr;

  /** Whether using ByteVC1 codec */
  is_bytevc1: number;

  /** Animated cover */
  animated_cover?: ScrapecreatorTiktokMediaUrl;

  /** AI-generated dynamic cover */
  ai_dynamic_cover?: ScrapecreatorTiktokMediaUrl;

  /** Cover timestamp position */
  CoverTsp?: number;

  /** Whether cover is custom */
  cover_is_custom?: boolean;
};

/**
 * TikTok author/user avatar info
 */
export type ScrapecreatorTiktokAvatar = {
  /** Avatar URI */
  uri: string;

  /** Array of avatar URLs at different sizes */
  url_list: string[];

  /** Avatar width */
  width: number;

  /** Avatar height */
  height: number;

  /** URL prefix (usually null) */
  url_prefix: string | null;
};

/**
 * TikTok post author information
 */
export type ScrapecreatorTiktokAuthor = {
  /** User ID */
  uid: string;

  /** Short ID (usually "0") */
  short_id: string;

  /** Display nickname */
  nickname: string;

  /** User bio/signature */
  signature: string;

  /** Large avatar */
  avatar_larger: ScrapecreatorTiktokAvatar;

  /** Thumbnail avatar */
  avatar_thumb: ScrapecreatorTiktokAvatar;

  /** Medium avatar */
  avatar_medium: ScrapecreatorTiktokAvatar;

  /** Unique username/handle */
  unique_id: string;

  /** Number of posts */
  aweme_count: number;

  /** Number of followers */
  follower_count: number;

  /** Number of following */
  following_count: number;

  /** Number of likes received */
  total_favorited: number;

  /** Whether user is verified */
  is_verified?: boolean;

  /** Secure user ID */
  sec_uid: string;
};

/**
 * TikTok post item from the API response (aweme = TikTok's internal name for posts)
 */
export type ScrapecreatorTiktokPost = {
  /** Post ID (aweme_id) */
  aweme_id: string;

  /** Post description/caption */
  desc: string;

  /** Description language code */
  desc_language: string;

  /** Region code (e.g., "US") */
  region: string;

  /** Post statistics */
  statistics: ScrapecreatorTiktokPostStatistics;

  /** Video information */
  video: ScrapecreatorTiktokVideo;

  /** Post author */
  author: ScrapecreatorTiktokAuthor;

  /** Unix timestamp when post was created */
  create_time: number;

  /** Whether this is an ad */
  is_ad: boolean;

  /** UTC timestamp string */
  create_time_utc: string;

  /** Whether this is a paid partnership */
  is_paid_partnership: boolean;

  /** Full URL to the post */
  url: string;

  /** Shop product URL (if applicable) */
  shop_product_url: string | null;

  /** Whether eligible for commission */
  is_eligible_for_commission: boolean;
};

/**
 * ScrapeCreator TikTok posts API response
 *
 * The complete response from the /v3/tiktok/profile/videos endpoint.
 */
export type ScrapecreatorTiktokPostsResponse = {
  /** Whether the API request was successful */
  success: boolean;

  /** Remaining API credits */
  credits_remaining?: number;

  /** Array of post items */
  aweme_list: ScrapecreatorTiktokPost[];

  /** Whether more posts are available (1 = true, 0 = false) */
  has_more: number;

  /** Cursor for fetching next page of posts */
  max_cursor: number;
};
