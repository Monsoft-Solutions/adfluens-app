/**
 * Google Business Profile Location Data Type
 *
 * Represents cached location metadata from the GMB API.
 * Stored in the gmb_connection table as JSONB.
 *
 * @module @repo/types/gmb/gmb-location-data
 */

/**
 * Phone numbers for a GMB location
 */
export type GMBPhoneNumbers = {
  primaryPhone?: string;
  additionalPhones?: string[];
};

/**
 * Category information for a GMB location
 */
export type GMBCategory = {
  name: string;
  displayName: string;
};

/**
 * Categories for a GMB location
 */
export type GMBCategories = {
  primaryCategory?: GMBCategory;
  additionalCategories?: GMBCategory[];
};

/**
 * Storefront address for a GMB location
 */
export type GMBStorefrontAddress = {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  regionCode?: string;
};

/**
 * Business hours period
 */
export type GMBHoursPeriod = {
  openDay: string;
  openTime: string;
  closeDay: string;
  closeTime: string;
};

/**
 * Regular business hours
 */
export type GMBRegularHours = {
  periods: GMBHoursPeriod[];
};

/**
 * Location metadata with links
 */
export type GMBLocationMetadata = {
  mapsUri?: string;
  newReviewUri?: string;
};

/**
 * Complete location data cached from GMB API
 */
export type GMBLocationData = {
  /** Full resource name (e.g., "locations/123456789") */
  name: string;

  /** Store code for the location */
  storeCode?: string;

  /** Display title of the location */
  title: string;

  /** Website URL */
  websiteUri?: string;

  /** Phone numbers */
  phoneNumbers?: GMBPhoneNumbers;

  /** Business categories */
  categories?: GMBCategories;

  /** Storefront address */
  storefrontAddress?: GMBStorefrontAddress;

  /** Regular business hours */
  regularHours?: GMBRegularHours;

  /** Metadata including Maps and review URLs */
  metadata?: GMBLocationMetadata;
};
