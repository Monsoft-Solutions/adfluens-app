/**
 * Social Media Platform Enum
 *
 * Supported social media platforms for scraping and data storage.
 *
 * @module @repo/types/social-media/social-media-platform
 */

/**
 * Supported social media platforms
 */
export const SocialMediaPlatform = {
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  TIKTOK: "tiktok",
  TWITTER: "twitter",
  LINKEDIN: "linkedin",
  YOUTUBE: "youtube",
} as const;

/** Social media platform type */
export type SocialMediaPlatform =
  (typeof SocialMediaPlatform)[keyof typeof SocialMediaPlatform];
