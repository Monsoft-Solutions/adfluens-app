/**
 * Facebook Platform Adapter
 *
 * Handles content publishing to Facebook Pages.
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

export const FACEBOOK_SPECS: PlatformSpecs = {
  platform: "facebook",
  maxCaptionLength: 63206,
  maxHashtags: 30, // No hard limit, but best practice
  maxImages: 10,
  recommendedImageSize: { width: 1200, height: 630 },
  supportedAspectRatios: ["16:9", "1:1", "4:5", "9:16"],
  supportsVideo: true,
  supportsCarousel: true,
};

// =============================================================================
// Validation
// =============================================================================

function validateFacebookPost(post: ContentPostRow): PlatformValidationResult {
  const errors: PlatformValidationResult["errors"] = [];
  const warnings: PlatformValidationResult["warnings"] = [];

  // Caption length
  if (post.caption.length > FACEBOOK_SPECS.maxCaptionLength) {
    errors.push({
      field: "caption",
      message: `Caption exceeds ${FACEBOOK_SPECS.maxCaptionLength} characters`,
    });
  }

  // Media count
  if (post.media.length > FACEBOOK_SPECS.maxImages) {
    errors.push({
      field: "media",
      message: `Maximum ${FACEBOOK_SPECS.maxImages} images allowed`,
    });
  }

  // Media required
  if (post.media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one image is required",
    });
  }

  // Hashtag count warning
  if (post.hashtags && post.hashtags.length > 10) {
    warnings.push({
      field: "hashtags",
      message: "Using more than 10 hashtags may reduce engagement",
    });
  }

  // Caption length recommendation
  if (post.caption.length > 500) {
    warnings.push({
      field: "caption",
      message: "Shorter captions (under 500 characters) tend to perform better",
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

function formatFacebookCaption(
  caption: string,
  hashtags?: string[] | null
): string {
  if (!hashtags || hashtags.length === 0) {
    return caption;
  }

  // Facebook: hashtags at end, separated by newlines
  const hashtagString = hashtags.map((h) => `#${h}`).join(" ");
  return `${caption}\n\n${hashtagString}`;
}

// =============================================================================
// Publishing
// =============================================================================

async function publishToFacebook(
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

export const facebookAdapter: PlatformAdapter = {
  platform: "facebook",
  specs: FACEBOOK_SPECS,
  validate: validateFacebookPost,
  formatCaption: formatFacebookCaption,
  publish: publishToFacebook,
};
