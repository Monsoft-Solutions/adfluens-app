/**
 * LinkedIn Platform Adapter
 *
 * Handles content publishing to LinkedIn Company Pages and Profiles.
 */

import type {
  PlatformSpecs,
  PlatformValidationResult,
  PlatformPublishResult,
} from "@repo/types/content/platform-specs.type";
import type { ContentPostRow } from "@repo/db";
import type { PlatformAdapter } from "./platform-adapter.type";

// =============================================================================
// Specifications
// =============================================================================

export const LINKEDIN_SPECS: PlatformSpecs = {
  platform: "linkedin",
  maxCaptionLength: 3000, // LinkedIn post character limit
  maxHashtags: 30, // LinkedIn recommends 3-5, max 30
  maxImages: 9, // LinkedIn carousel limit
  recommendedImageSize: { width: 1200, height: 627 },
  supportedAspectRatios: ["1.91:1", "1:1", "4:5"],
  supportsVideo: true,
  supportsCarousel: true, // Document carousel support
};

// =============================================================================
// Validation
// =============================================================================

function validateLinkedinPost(post: ContentPostRow): PlatformValidationResult {
  const errors: PlatformValidationResult["errors"] = [];
  const warnings: PlatformValidationResult["warnings"] = [];

  // Caption length
  if (post.caption.length > LINKEDIN_SPECS.maxCaptionLength) {
    errors.push({
      field: "caption",
      message: `Caption exceeds ${LINKEDIN_SPECS.maxCaptionLength} characters`,
    });
  }

  // Media count
  if (post.media.length > LINKEDIN_SPECS.maxImages) {
    errors.push({
      field: "media",
      message: `Maximum ${LINKEDIN_SPECS.maxImages} images allowed`,
    });
  }

  // Media required
  if (post.media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one image is required",
    });
  }

  // Hashtag count recommendation
  if (post.hashtags && post.hashtags.length > 5) {
    warnings.push({
      field: "hashtags",
      message:
        "LinkedIn recommends 3-5 hashtags for optimal reach. More may appear spammy.",
    });
  }

  // Caption length recommendation for engagement
  if (post.caption.length > 1300) {
    warnings.push({
      field: "caption",
      message:
        "Posts under 1,300 characters show full content without 'see more' and get better engagement",
    });
  }

  // Professional tone reminder
  if (post.caption.length < 100) {
    warnings.push({
      field: "caption",
      message:
        "LinkedIn posts with more context (100+ characters) typically perform better",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Caption Formatting
// =============================================================================

function formatLinkedinCaption(
  caption: string,
  hashtags?: string[] | null
): string {
  if (!hashtags || hashtags.length === 0) {
    return caption;
  }

  // LinkedIn: hashtags at end, each on visible line for discoverability
  const hashtagString = hashtags.map((h) => `#${h}`).join(" ");
  return `${caption}\n\n${hashtagString}`;
}

// =============================================================================
// Publishing
// =============================================================================

async function publishToLinkedin(
  _post: ContentPostRow,
  _credentials: unknown
): Promise<PlatformPublishResult> {
  // TODO: Implement LinkedIn publishing via LinkedIn API
  throw new Error("LinkedIn publishing not yet implemented");
}

// =============================================================================
// Adapter Export
// =============================================================================

export const linkedinAdapter: PlatformAdapter = {
  platform: "linkedin",
  specs: LINKEDIN_SPECS,
  validate: validateLinkedinPost,
  formatCaption: formatLinkedinCaption,
  publish: publishToLinkedin,
};
