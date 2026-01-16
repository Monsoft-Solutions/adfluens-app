/**
 * Google My Business (GMB) Platform Adapter
 *
 * Handles content publishing to Google Business Profile.
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

export const GMB_SPECS: PlatformSpecs = {
  platform: "gmb",
  maxCaptionLength: 1500, // GMB post description limit
  maxHashtags: 0, // GMB doesn't support hashtags
  maxImages: 10, // GMB supports up to 10 photos
  recommendedImageSize: { width: 1200, height: 900 },
  supportedAspectRatios: ["4:3", "1:1"],
  supportsVideo: true, // Short videos supported
  supportsCarousel: false, // No carousel support
};

// =============================================================================
// Validation
// =============================================================================

function validateGmbPost(post: ContentPostRow): PlatformValidationResult {
  const errors: PlatformValidationResult["errors"] = [];
  const warnings: PlatformValidationResult["warnings"] = [];

  // Caption length
  if (post.caption.length > GMB_SPECS.maxCaptionLength) {
    errors.push({
      field: "caption",
      message: `Caption exceeds ${GMB_SPECS.maxCaptionLength} characters`,
    });
  }

  // Media count
  if (post.media.length > GMB_SPECS.maxImages) {
    errors.push({
      field: "media",
      message: `Maximum ${GMB_SPECS.maxImages} images allowed`,
    });
  }

  // Media required
  if (post.media.length === 0) {
    errors.push({
      field: "media",
      message: "At least one image is required",
    });
  }

  // Hashtags warning (GMB doesn't use hashtags)
  if (post.hashtags && post.hashtags.length > 0) {
    warnings.push({
      field: "hashtags",
      message:
        "Google Business Profile doesn't display hashtags - they will be ignored",
    });
  }

  // Caption length recommendation
  if (post.caption.length > 750) {
    warnings.push({
      field: "caption",
      message:
        "Shorter posts (under 750 characters) tend to perform better on GMB",
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

function formatGmbCaption(
  caption: string,
  _hashtags?: string[] | null
): string {
  // GMB doesn't support hashtags, so we just return the caption
  return caption;
}

// =============================================================================
// Publishing
// =============================================================================

async function publishToGmb(
  _post: ContentPostRow,
  _credentials: unknown
): Promise<PlatformPublishResult> {
  // TODO: Implement GMB publishing via Google My Business API
  throw new Error("GMB publishing not yet implemented");
}

// =============================================================================
// Adapter Export
// =============================================================================

export const gmbAdapter: PlatformAdapter = {
  platform: "gmb",
  specs: GMB_SPECS,
  validate: validateGmbPost,
  formatCaption: formatGmbCaption,
  publish: publishToGmb,
};
