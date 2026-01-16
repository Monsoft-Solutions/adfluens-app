/**
 * Platform Adapters Index
 *
 * Registry of all platform adapters for content publishing.
 * To add a new platform, create an adapter file and register it here.
 */

import { facebookAdapter, FACEBOOK_SPECS } from "./facebook.adapter";
import { instagramAdapter, INSTAGRAM_SPECS } from "./instagram.adapter";
import { gmbAdapter, GMB_SPECS } from "./gmb.adapter";
import { linkedinAdapter, LINKEDIN_SPECS } from "./linkedin.adapter";
import { twitterAdapter, TWITTER_SPECS } from "./twitter.adapter";
import type { PlatformAdapter } from "./platform-adapter.type";
import type { PlatformSpecs } from "@repo/types/content/platform-specs.type";

// =============================================================================
// Adapter Registry
// =============================================================================

/**
 * All registered platform adapters
 */
export const platformAdapters: Record<string, PlatformAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  gmb: gmbAdapter,
  linkedin: linkedinAdapter,
  twitter: twitterAdapter,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get adapter for a specific platform
 * @throws Error if platform is not supported
 */
export function getAdapter(platform: string): PlatformAdapter {
  const adapter = platformAdapters[platform];
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: string): boolean {
  return platform in platformAdapters;
}

/**
 * Get all registered platform names
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(platformAdapters);
}

/**
 * Get specifications for all registered platforms
 */
export function getAllSpecs(): PlatformSpecs[] {
  return Object.values(platformAdapters).map((adapter) => adapter.specs);
}

/**
 * Get specifications for a specific platform
 * @throws Error if platform is not supported
 */
export function getSpecs(platform: string): PlatformSpecs {
  return getAdapter(platform).specs;
}

// =============================================================================
// Re-exports
// =============================================================================

export type { PlatformAdapter } from "./platform-adapter.type";
export {
  FACEBOOK_SPECS,
  INSTAGRAM_SPECS,
  GMB_SPECS,
  LINKEDIN_SPECS,
  TWITTER_SPECS,
};
