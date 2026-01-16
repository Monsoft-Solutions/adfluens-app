/**
 * Platform Adapter Type
 *
 * Defines the interface for platform-specific content publishing adapters.
 * Each platform implements this interface to handle its specific requirements.
 */

import type {
  PlatformSpecs,
  PlatformValidationResult,
  PlatformPublishResult,
} from "@repo/types/content/platform-specs.type";
import type { ContentPostRow } from "@repo/db";

/**
 * Platform adapter interface
 *
 * Each platform must implement this interface to provide:
 * - Specifications (limits, dimensions, etc.)
 * - Validation logic
 * - Caption formatting
 * - Publishing logic
 */
export type PlatformAdapter = {
  /** Platform identifier */
  platform: string;

  /** Platform specifications and limits */
  specs: PlatformSpecs;

  /**
   * Validate a post against platform requirements
   * @param post The content post to validate
   * @returns Validation result with errors and warnings
   */
  validate: (post: ContentPostRow) => PlatformValidationResult;

  /**
   * Format caption with hashtags for the platform
   * @param caption The post caption
   * @param hashtags Optional hashtags to include
   * @returns Formatted caption ready for publishing
   */
  formatCaption: (caption: string, hashtags?: string[] | null) => string;

  /**
   * Publish a post to the platform
   * @param post The content post to publish
   * @param credentials Platform-specific credentials
   * @returns Publish result with post ID and permalink
   */
  publish: (
    post: ContentPostRow,
    credentials: unknown
  ) => Promise<PlatformPublishResult>;
};
