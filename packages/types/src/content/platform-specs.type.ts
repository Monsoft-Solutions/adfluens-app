/**
 * Platform Specifications
 *
 * Defines the constraints and capabilities for each social media platform.
 */

export type PlatformSpecs = {
  /** Platform identifier */
  platform: string;
  /** Maximum caption/text length in characters */
  maxCaptionLength: number;
  /** Maximum number of hashtags allowed */
  maxHashtags: number;
  /** Maximum number of images in a single post */
  maxImages: number;
  /** Recommended image dimensions */
  recommendedImageSize: { width: number; height: number };
  /** Supported aspect ratios for images */
  supportedAspectRatios: string[];
  /** Whether the platform supports video posts */
  supportsVideo: boolean;
  /** Whether the platform supports carousel/multi-image posts */
  supportsCarousel: boolean;
};

export type PlatformValidationError = {
  field: string;
  message: string;
};

export type PlatformValidationWarning = {
  field: string;
  message: string;
};

export type PlatformValidationResult = {
  isValid: boolean;
  errors: PlatformValidationError[];
  warnings: PlatformValidationWarning[];
};

export type PlatformPublishResult = {
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
  publishedAt?: string;
};
