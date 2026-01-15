/**
 * Twitter/X Platform Adapter
 *
 * Handles content publishing to Twitter/X.
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

export const TWITTER_SPECS: PlatformSpecs = {
  platform: "twitter",
  maxCaptionLength: 280, // Standard tweet limit (X Premium: 25,000)
  maxHashtags: 10, // Best practice, no hard limit
  maxImages: 4, // Twitter image limit per tweet
  recommendedImageSize: { width: 1200, height: 675 },
  supportedAspectRatios: ["16:9", "1:1", "4:5"],
  supportsVideo: true,
  supportsCarousel: false, // No native carousel, but multiple images allowed
};

// =============================================================================
// Validation
// =============================================================================

function validateTwitterPost(post: ContentPostRow): PlatformValidationResult {
  const errors: PlatformValidationResult["errors"] = [];
  const warnings: PlatformValidationResult["warnings"] = [];

  // Calculate total caption length including hashtags
  const hashtagLength =
    post.hashtags?.reduce((acc, h) => acc + h.length + 2, 0) || 0; // +2 for # and space
  const totalLength = post.caption.length + hashtagLength;

  // Caption length (with hashtags)
  if (totalLength > TWITTER_SPECS.maxCaptionLength) {
    errors.push({
      field: "caption",
      message: `Tweet exceeds ${TWITTER_SPECS.maxCaptionLength} characters (${totalLength} with hashtags)`,
    });
  }

  // Media count
  if (post.media.length > TWITTER_SPECS.maxImages) {
    errors.push({
      field: "media",
      message: `Maximum ${TWITTER_SPECS.maxImages} images allowed per tweet`,
    });
  }

  // Media required (for this content creation flow)
  if (post.media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one image is required",
    });
  }

  // Hashtag count recommendation
  if (post.hashtags && post.hashtags.length > 3) {
    warnings.push({
      field: "hashtags",
      message:
        "Twitter recommends 1-2 hashtags per tweet. More may reduce engagement.",
    });
  }

  // Character budget warning
  if (totalLength > 250) {
    warnings.push({
      field: "caption",
      message: `Only ${TWITTER_SPECS.maxCaptionLength - totalLength} characters remaining`,
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

function formatTwitterCaption(
  caption: string,
  hashtags?: string[] | null
): string {
  if (!hashtags || hashtags.length === 0) {
    return caption;
  }

  // Twitter: hashtags inline or at end, space-separated
  const hashtagString = hashtags.map((h) => `#${h}`).join(" ");
  return `${caption} ${hashtagString}`;
}

// =============================================================================
// Publishing
// =============================================================================

async function publishToTwitter(
  _post: ContentPostRow,
  _credentials: unknown
): Promise<PlatformPublishResult> {
  // TODO: Implement Twitter publishing via Twitter API v2
  throw new Error("Twitter publishing not yet implemented");
}

// =============================================================================
// Adapter Export
// =============================================================================

export const twitterAdapter: PlatformAdapter = {
  platform: "twitter",
  specs: TWITTER_SPECS,
  validate: validateTwitterPost,
  formatCaption: formatTwitterCaption,
  publish: publishToTwitter,
};
