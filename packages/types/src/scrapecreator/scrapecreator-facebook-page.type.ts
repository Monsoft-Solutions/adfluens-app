/**
 * ScrapeCreator Facebook Page API Response Types
 *
 * Types for the Facebook page endpoint from the ScrapeCreator API.
 * These types represent the raw API response structure.
 *
 * @see https://api.scrapecreators.com/v1/facebook/page
 * @module @repo/types/scrapecreator/scrapecreator-facebook-page
 */

/**
 * Focus point for Facebook cover photo
 */
export type ScrapecreatorFacebookCoverPhotoFocus = {
  /** X coordinate of focus point (0-1) */
  x: number;

  /** Y coordinate of focus point (0-1) */
  y: number;
};

/**
 * Image dimensions from ScrapeCreator Facebook API
 */
export type ScrapecreatorFacebookImage = {
  /** Image URI/URL */
  uri: string;

  /** Image width in pixels */
  width: number;

  /** Image height in pixels */
  height: number;
};

/**
 * Viewer image dimensions (display dimensions)
 */
export type ScrapecreatorFacebookViewerImage = {
  /** Display height */
  height: number;

  /** Display width */
  width: number;
};

/**
 * Photo data from ScrapeCreator Facebook API
 */
export type ScrapecreatorFacebookPhoto = {
  /** Photo ID */
  id: string;

  /** Main image data */
  image: ScrapecreatorFacebookImage;

  /** Viewer image dimensions */
  viewer_image?: ScrapecreatorFacebookViewerImage;

  /** Blurred image data (for loading) */
  blurred_image?: ScrapecreatorFacebookImage;

  /** Photo URL on Facebook */
  url?: string;
};

/**
 * Cover photo from ScrapeCreator Facebook page API
 */
export type ScrapecreatorFacebookCoverPhoto = {
  /** Focus point for cover photo cropping */
  focus: ScrapecreatorFacebookCoverPhotoFocus;

  /** Photo details */
  photo: ScrapecreatorFacebookPhoto;
};

/**
 * Profile photo from ScrapeCreator Facebook page API
 */
export type ScrapecreatorFacebookProfilePhoto = {
  /** Photo URL on Facebook */
  url: string;

  /** Viewer image dimensions */
  viewer_image?: ScrapecreatorFacebookViewerImage;

  /** Photo ID */
  id: string;
};

/**
 * Ad library information from ScrapeCreator Facebook page API
 */
export type ScrapecreatorFacebookAdLibrary = {
  /** Ad status description */
  adStatus: string;

  /** Page ID for ad library */
  pageId: string;
};

/**
 * ScrapeCreator Facebook page API response
 *
 * The complete response from the /v1/facebook/page endpoint.
 */
export type ScrapecreatorFacebookPageResponse = {
  /** Whether the API request was successful */
  success: boolean;

  /** Remaining API credits */
  credits_remaining?: number;

  /** Ad library information */
  adLibrary?: ScrapecreatorFacebookAdLibrary;

  /** Page creation date string */
  creationDate?: string;

  /** Facebook page ID */
  id: string;

  /** Page name */
  name: string;

  /** Page URL */
  url: string;

  /** Gender setting (MALE, FEMALE, NEUTER) */
  gender?: string;

  /** Cover photo data */
  coverPhoto?: ScrapecreatorFacebookCoverPhoto;

  /** Whether business page is active */
  isBusinessPageActive?: boolean;

  /** Profile photo data */
  profilePhoto?: ScrapecreatorFacebookProfilePhoto;

  /** Large profile picture URL */
  profilePicLarge?: string;

  /** Medium profile picture URL */
  profilePicMedium?: string;

  /** Small profile picture URL */
  profilePicSmall?: string;

  /** Page intro/about text */
  pageIntro?: string;

  /** Business category */
  category?: string;

  /** Physical address */
  address?: string;

  /** Contact email */
  email?: string;

  /** Associated links (other social profiles) */
  links?: string[];

  /** Contact phone number */
  phone?: string;

  /** Website URL */
  website?: string;

  /** Price range indicator (e.g., "$$$") */
  priceRange?: string;

  /** Rating count */
  ratingCount?: number | null;

  /** Total page likes */
  likeCount?: number;

  /** Total page followers */
  followerCount?: number;
};
