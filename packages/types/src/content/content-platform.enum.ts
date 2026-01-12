/**
 * Content Platform Enum
 *
 * Supported platforms for content publishing.
 * Phase 1: Facebook, Instagram
 * Future: GMB, LinkedIn, Twitter
 */

export const ContentPlatform = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  GMB: "gmb",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
} as const;

export type ContentPlatform =
  (typeof ContentPlatform)[keyof typeof ContentPlatform];

/** Phase 1 supported platforms */
export const PHASE1_PLATFORMS = [
  ContentPlatform.FACEBOOK,
  ContentPlatform.INSTAGRAM,
] as const;

export type Phase1Platform = (typeof PHASE1_PLATFORMS)[number];
