/**
 * ScrapeCreator Instagram Profile API Response Types
 *
 * Types for the Instagram profile endpoint from the ScrapeCreator API.
 * These types represent the raw API response structure.
 *
 * @see https://api.scrapecreators.com/v1/instagram/profile
 * @module @repo/types/scrapecreator/scrapecreator-instagram-profile
 */

/**
 * Business address from ScrapeCreator Instagram profile API
 *
 * Contains location information for business Instagram accounts.
 */
export type ScrapecreatorInstagramBusinessAddress = {
  /** City name */
  city_name?: string;

  /** Facebook city ID */
  city_id?: number;

  /** Latitude coordinate */
  latitude?: number;

  /** Longitude coordinate */
  longitude?: number;

  /** Street address */
  street_address?: string;

  /** ZIP/postal code */
  zip_code?: string;
};

/**
 * Bio link from ScrapeCreator Instagram profile API
 *
 * Represents a link in the user's bio/profile.
 */
export type ScrapecreatorInstagramBioLink = {
  /** Link title (display text) */
  title?: string;

  /** Full URL */
  url: string;

  /** Instagram's internal redirect URL */
  lynx_url?: string;

  /** Link type (e.g., "external") */
  link_type?: string;
};

/**
 * User data from ScrapeCreator Instagram profile API
 *
 * Contains the full Instagram user profile information.
 */
export type ScrapecreatorInstagramUser = {
  /** Instagram user ID */
  id: string;

  /** Instagram username/handle */
  username: string;

  /** Full display name */
  full_name: string;

  /** Biography/description text */
  biography: string;

  /** Array of bio links */
  bio_links?: ScrapecreatorInstagramBioLink[];

  /** External website URL */
  external_url?: string;

  /** Follower count */
  edge_followed_by: { count: number };

  /** Following count */
  edge_follow: { count: number };

  /** Whether account is verified */
  is_verified: boolean;

  /** Whether account is a business account */
  is_business_account: boolean;

  /** Whether account is a professional account */
  is_professional_account?: boolean;

  /** Whether account is private */
  is_private: boolean;

  /** Profile picture URL (standard resolution) */
  profile_pic_url: string;

  /** Profile picture URL (high resolution) */
  profile_pic_url_hd?: string;

  /** Business category name */
  category_name?: string;

  /** Business address information */
  business_address_json?: ScrapecreatorInstagramBusinessAddress;

  /** Facebook ID connection */
  fbid?: string;

  /** Total media/posts count */
  edge_owner_to_timeline_media: {
    count: number;
  };

  /** Total reels/video count */
  edge_felix_video_timeline?: {
    count: number;
  };
};

/**
 * ScrapeCreator Instagram profile API response
 *
 * The complete response from the /v1/instagram/profile endpoint.
 */
export type ScrapecreatorInstagramProfileResponse = {
  /** Whether the API request was successful */
  success: boolean;

  /** Remaining API credits */
  credits_remaining?: number;

  /** Response data containing the user profile */
  data: {
    user: ScrapecreatorInstagramUser;
  };
};
