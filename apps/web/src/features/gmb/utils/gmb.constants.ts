/**
 * GMB Feature Constants
 *
 * Shared constants for Google Business Profile components.
 */

import type { GMBMediaCategory } from "@repo/types/gmb/gmb-media.type";
import type { GMBStarRating } from "@repo/types/gmb/gmb-review.type";

/**
 * Human-readable labels for media categories
 */
export const GMB_CATEGORY_LABELS: Record<GMBMediaCategory, string> = {
  COVER: "Cover",
  PROFILE: "Profile",
  INTERIOR: "Interior",
  EXTERIOR: "Exterior",
  FOOD_AND_DRINK: "Food & Drink",
  MENU: "Menu",
  PRODUCT: "Product",
  TEAM: "Team",
  ADDITIONAL: "Additional",
};

/**
 * Category options for select dropdowns (excludes COVER and PROFILE which are system-managed)
 */
export const GMB_CATEGORY_OPTIONS: Array<{
  value: GMBMediaCategory;
  label: string;
}> = [
  { value: "ADDITIONAL", label: "Additional" },
  { value: "EXTERIOR", label: "Exterior" },
  { value: "INTERIOR", label: "Interior" },
  { value: "FOOD_AND_DRINK", label: "Food & Drink" },
  { value: "MENU", label: "Menu" },
  { value: "PRODUCT", label: "Product" },
  { value: "TEAM", label: "Team" },
];

/**
 * Mapping from star rating enum to numeric value
 */
export const STAR_RATING_MAP: Record<GMBStarRating, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};
