/**
 * ScrapeCreator Instagram Posts API Response Types
 *
 * Types for the Instagram user posts endpoint from the ScrapeCreator API v2.
 * These types represent the raw API response structure.
 *
 * @see https://api.scrapecreators.com/v2/instagram/user/posts
 * @module @repo/types/scrapecreator/scrapecreator-instagram-posts
 */

/**
 * Video version from Instagram post
 */
export type ScrapecreatorInstagramVideoVersion = {
  /** Bandwidth (usually null) */
  bandwidth: number | null;

  /** Video height in pixels */
  height: number;

  /** Video type identifier */
  type: number;

  /** Video URL */
  url: string;

  /** URL expiration timestamp */
  url_expiration_timestamp_us: number | null;

  /** Video width in pixels */
  width: number;

  /** Fallback URL */
  fallback: string | null;
};

/**
 * Image candidate from Instagram post
 */
export type ScrapecreatorInstagramImageCandidate = {
  /** Estimated scan sizes (usually empty) */
  estimated_scans_sizes: unknown[];

  /** Image height in pixels */
  height: number;

  /** Scans profile (usually null) */
  scans_profile: string | null;

  /** Image URL */
  url: string;

  /** Image width in pixels */
  width: number;
};

/**
 * Image versions container
 */
export type ScrapecreatorInstagramImageVersions = {
  /** Additional candidate images */
  additional_candidates?: {
    first_frame?: ScrapecreatorInstagramImageCandidate;
    igtv_first_frame?: ScrapecreatorInstagramImageCandidate;
    smart_frame?: ScrapecreatorInstagramImageCandidate | null;
  };

  /** Array of image candidates at different resolutions */
  candidates: ScrapecreatorInstagramImageCandidate[];

  /** Scrubber spritesheet info for video thumbnails */
  scrubber_spritesheet_info_candidates?: {
    default?: {
      file_size_kb: number;
      max_thumbnails_per_sprite: number;
      rendered_width: number;
      sprite_height: number;
      sprite_urls: string[];
      sprite_width: number;
      thumbnail_duration: number;
      thumbnail_height: number;
      thumbnail_width: number;
      thumbnails_per_row: number;
      total_thumbnail_num_per_sprite: number;
      video_length: number;
    };
  };
};

/**
 * User info within a post caption
 */
export type ScrapecreatorInstagramCaptionUser = {
  /** User primary key */
  pk: string;

  /** User primary key ID */
  pk_id: string;

  /** User ID */
  id: string;

  /** Full display name */
  full_name: string;

  /** Whether user is unpublished */
  is_unpublished: boolean;

  /** Strong ID */
  strong_id__: string;

  /** Facebook ID v2 */
  fbid_v2: string;

  /** Username/handle */
  username: string;

  /** Whether account is private */
  is_private: boolean;

  /** Whether account is verified */
  is_verified: boolean;

  /** Profile picture ID */
  profile_pic_id?: string;

  /** Profile picture URL */
  profile_pic_url: string;
};

/**
 * Caption object from Instagram post
 */
export type ScrapecreatorInstagramPostCaption = {
  /** Bit flags */
  bit_flags: number;

  /** Creation timestamp */
  created_at: number;

  /** Creation timestamp UTC */
  created_at_utc: number;

  /** Whether reported as spam */
  did_report_as_spam: boolean;

  /** Whether is ranked comment */
  is_ranked_comment: boolean;

  /** Caption primary key */
  pk: string;

  /** Whether sharing is enabled */
  share_enabled: boolean;

  /** Content type */
  content_type: string;

  /** Associated media ID */
  media_id: string;

  /** Caption status */
  status: string;

  /** Caption type */
  type: number;

  /** User ID who created the caption */
  user_id: string;

  /** Strong ID */
  strong_id__: string;

  /** Caption text content */
  text: string;

  /** User info */
  user: ScrapecreatorInstagramCaptionUser;

  /** Whether caption is covered */
  is_covered: boolean;

  /** Private reply status */
  private_reply_status: number;

  /** Translated text (if available) */
  text_translation?: string;
};

/**
 * User/owner info in post
 */
export type ScrapecreatorInstagramPostUser = {
  /** Facebook ID v2 */
  fbid_v2: string;

  /** Whether feed post reshare is disabled */
  feed_post_reshare_disabled: boolean;

  /** Full display name */
  full_name: string;

  /** User ID */
  id: string;

  /** Whether user is unpublished */
  is_unpublished: boolean;

  /** User primary key */
  pk: string;

  /** User primary key ID */
  pk_id: string;

  /** Strong ID */
  strong_id__: string;

  /** Third party downloads enabled */
  third_party_downloads_enabled: number;

  /** Can see quiet post attribution */
  can_see_quiet_post_attribution: boolean;

  /** Eligible for text app activation badge */
  eligible_for_text_app_activation_badge: boolean;

  /** Account type */
  account_type: number;

  /** Account badges */
  account_badges: unknown[];

  /** Fan club info */
  fan_club_info: {
    autosave_to_exclusive_highlight: unknown | null;
    connected_member_count: number | null;
    fan_club_id: string | null;
    fan_club_name: string | null;
    has_created_ssc: boolean | null;
    has_enough_subscribers_for_ssc: boolean | null;
    is_fan_club_gifting_eligible: boolean | null;
    is_fan_club_referral_eligible: boolean | null;
    is_free_trial_eligible: boolean | null;
    largest_public_bc_id: string | null;
    subscriber_count: number | null;
    should_show_playlists_in_profile_tab: boolean | null;
    fan_consideration_page_revamp_eligiblity: unknown | null;
  };

  /** Whether has anonymous profile picture */
  has_anonymous_profile_picture: boolean;

  /** HD profile picture URL info */
  hd_profile_pic_url_info?: {
    height: number;
    url: string;
    width: number;
  };

  /** HD profile picture versions */
  hd_profile_pic_versions?: Array<{
    height: number;
    url: string;
    width: number;
  }>;

  /** Whether account is private */
  is_private: boolean;

  /** Whether account is verified */
  is_verified: boolean;

  /** Profile picture ID */
  profile_pic_id?: string;

  /** Profile picture URL */
  profile_pic_url: string;

  /** Show account transparency details */
  show_account_transparency_details: boolean;

  /** Transparency product enabled */
  transparency_product_enabled: boolean;

  /** Username/handle */
  username: string;

  /** Whether embeds are disabled */
  is_embeds_disabled: boolean;
};

/**
 * Instagram post item from the API response
 *
 * Media types:
 * - 1: Image/Photo
 * - 2: Video/Reel
 * - 8: Carousel (multiple images/videos)
 */
export type ScrapecreatorInstagramPost = {
  /** Post ID */
  id: string;

  /** Post shortcode (used in URLs) */
  code: string;

  /** Media type: 1=image, 2=video, 8=carousel */
  media_type: number;

  /** Unix timestamp when post was taken/published */
  taken_at: number;

  /** Post caption */
  caption: ScrapecreatorInstagramPostCaption | null;

  /** Play count (for videos) */
  play_count?: number;

  /** Instagram play count */
  ig_play_count?: number;

  /** Comment count */
  comment_count: number;

  /** Like count */
  like_count: number;

  /** Display URI (thumbnail) */
  display_uri: string;

  /** User who posted */
  user: ScrapecreatorInstagramPostUser;

  /** Owner of the post */
  owner: ScrapecreatorInstagramPostUser;

  /** Image versions at different resolutions */
  image_versions2: ScrapecreatorInstagramImageVersions;

  /** Product type: "clips" for reels, "feed" for regular posts */
  product_type: string;

  /** Music metadata (if applicable) */
  music_metadata: unknown | null;

  /** Whether post is a paid partnership */
  is_paid_partnership: boolean;

  /** Video sticker locales */
  video_sticker_locales: unknown[];

  /** Video versions (for video posts) */
  video_versions?: ScrapecreatorInstagramVideoVersion[];

  /** Video duration in seconds (for video posts) */
  video_duration?: number;

  /** Whether video has audio */
  has_audio?: boolean;

  /** Full post URL */
  url: string;
};

/**
 * User summary in the response
 */
export type ScrapecreatorInstagramPostsUser = {
  /** User primary key */
  pk: string;

  /** User primary key ID */
  pk_id: string;

  /** Full display name */
  full_name: string;

  /** Strong ID */
  strong_id__: string;

  /** Profile grid display type */
  profile_grid_display_type: string;

  /** User ID */
  id: string;

  /** Username/handle */
  username: string;

  /** Whether account is private */
  is_private: boolean;

  /** Whether account is verified */
  is_verified: boolean;

  /** Profile picture ID */
  profile_pic_id?: string;

  /** Profile picture URL */
  profile_pic_url: string;

  /** Whether user is active on Threads */
  is_active_on_text_post_app: boolean;
};

/**
 * ScrapeCreator Instagram posts API response
 *
 * The complete response from the /v2/instagram/user/posts endpoint.
 */
export type ScrapecreatorInstagramPostsResponse = {
  /** Whether the API request was successful */
  success: boolean;

  /** Remaining API credits */
  credits_remaining?: number;

  /** Array of post items */
  items: ScrapecreatorInstagramPost[];

  /** User summary */
  user: ScrapecreatorInstagramPostsUser;

  /** Whether more posts are available */
  more_available: boolean;

  /** Number of results returned */
  num_results: number;

  /** Cursor for fetching next page */
  next_max_id?: string;
};
