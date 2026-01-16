/**
 * Instagram Platform Adapter
 *
 * Handles content publishing to Instagram Business accounts.
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

export const INSTAGRAM_SPECS: PlatformSpecs = {
  platform: "instagram",
  maxCaptionLength: 2200,
  maxHashtags: 30,
  maxImages: 10,
  recommendedImageSize: { width: 1080, height: 1080 },
  supportedAspectRatios: ["1:1", "4:5", "1.91:1"],
  supportsVideo: true,
  supportsCarousel: true,
};

// =============================================================================
// Validation
// =============================================================================

function validateInstagramPost(post: ContentPostRow): PlatformValidationResult {
  const errors: PlatformValidationResult["errors"] = [];
  const warnings: PlatformValidationResult["warnings"] = [];

  // Caption length
  if (post.caption.length > INSTAGRAM_SPECS.maxCaptionLength) {
    errors.push({
      field: "caption",
      message: `Caption exceeds ${INSTAGRAM_SPECS.maxCaptionLength} characters`,
    });
  }

  // Hashtag count
  if (post.hashtags && post.hashtags.length > INSTAGRAM_SPECS.maxHashtags) {
    errors.push({
      field: "hashtags",
      message: `Maximum ${INSTAGRAM_SPECS.maxHashtags} hashtags allowed`,
    });
  }

  // Media count
  if (post.media.length > INSTAGRAM_SPECS.maxImages) {
    errors.push({
      field: "media",
      message: `Maximum ${INSTAGRAM_SPECS.maxImages} images allowed`,
    });
  }

  // Media required
  if (post.media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one image is required",
    });
  }

  // Hashtag count warning (optimal is 5-10)
  if (post.hashtags && post.hashtags.length > 20) {
    warnings.push({
      field: "hashtags",
      message: "Using 5-10 hashtags is recommended for best engagement",
    });
  }

  // Caption length recommendation
  if (post.caption.length > 125) {
    warnings.push({
      field: "caption",
      message: "First 125 characters are most visible - make them count",
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

function formatInstagramCaption(
  caption: string,
  hashtags?: string[] | null
): string {
  if (!hashtags || hashtags.length === 0) {
    return caption;
  }

  // Instagram: limit to 30 hashtags, separated by spaces
  const limitedHashtags = hashtags.slice(0, INSTAGRAM_SPECS.maxHashtags);
  const hashtagString = limitedHashtags.map((h) => `#${h}`).join(" ");

  // Use line breaks to push hashtags below the "more" fold
  return `${caption}\n\n.\n.\n.\n\n${hashtagString}`;
}

// =============================================================================
// Publishing
// =============================================================================

async function publishToInstagram(
  _post: ContentPostRow,
  _credentials: unknown
): Promise<PlatformPublishResult> {
  // This will be implemented to call meta-content-api.utils.ts
  // Placeholder for now - actual implementation in content.service.ts
  throw new Error(
    "Direct publishing through adapter not supported. Use content.service.ts"
  );
}

// =============================================================================
// Adapter Export
// =============================================================================

export const instagramAdapter: PlatformAdapter = {
  platform: "instagram",
  specs: INSTAGRAM_SPECS,
  validate: validateInstagramPost,
  formatCaption: formatInstagramCaption,
  publish: publishToInstagram,
};
