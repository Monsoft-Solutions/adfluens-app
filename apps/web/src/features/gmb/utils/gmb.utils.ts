/**
 * GMB Feature Utilities
 *
 * Shared utility functions for Google Business Profile components.
 */

import type { GMBStarRating } from "@repo/types/gmb/gmb-review.type";
import { STAR_RATING_MAP } from "./gmb.constants";

/**
 * Convert star rating enum to numeric value
 */
export function starRatingToNumber(rating: GMBStarRating): number {
  return STAR_RATING_MAP[rating] ?? 3;
}

/**
 * Format a date string to a localized short format
 */
export function formatGMBDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
