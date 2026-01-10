/**
 * Google Business Profile Location Data Type
 *
 * Represents cached location metadata from the GMB API.
 * Stored in the gmb_connection table as JSONB.
 *
 * @module @repo/types/gmb/gmb-location-data
 */

import { z } from "zod";

/**
 * Phone numbers schema
 */
export const gmbPhoneNumbersSchema = z.object({
  primaryPhone: z.string().optional(),
  additionalPhones: z.array(z.string()).optional(),
});

export type GMBPhoneNumbers = z.infer<typeof gmbPhoneNumbersSchema>;

/**
 * Category schema
 */
export const gmbCategorySchema = z.object({
  name: z.string(),
  displayName: z.string(),
});

export type GMBCategory = z.infer<typeof gmbCategorySchema>;

/**
 * Categories schema
 */
export const gmbCategoriesSchema = z.object({
  primaryCategory: gmbCategorySchema.optional(),
  additionalCategories: z.array(gmbCategorySchema).optional(),
});

export type GMBCategories = z.infer<typeof gmbCategoriesSchema>;

/**
 * Storefront address schema
 */
export const gmbStorefrontAddressSchema = z.object({
  addressLines: z.array(z.string()).optional(),
  locality: z.string().optional(),
  administrativeArea: z.string().optional(),
  postalCode: z.string().optional(),
  regionCode: z.string().optional(),
});

export type GMBStorefrontAddress = z.infer<typeof gmbStorefrontAddressSchema>;

/**
 * Hours period schema
 */
export const gmbHoursPeriodSchema = z.object({
  openDay: z.string(),
  openTime: z.string(),
  closeDay: z.string(),
  closeTime: z.string(),
});

export type GMBHoursPeriod = z.infer<typeof gmbHoursPeriodSchema>;

/**
 * Regular hours schema
 */
export const gmbRegularHoursSchema = z.object({
  periods: z.array(gmbHoursPeriodSchema),
});

export type GMBRegularHours = z.infer<typeof gmbRegularHoursSchema>;

/**
 * Location metadata schema
 */
export const gmbLocationMetadataSchema = z.object({
  mapsUri: z.string().optional(),
  newReviewUri: z.string().optional(),
});

export type GMBLocationMetadata = z.infer<typeof gmbLocationMetadataSchema>;

/**
 * Complete location data schema
 */
export const gmbLocationDataSchema = z.object({
  /** Full resource name (e.g., "locations/123456789") */
  name: z.string(),

  /** Store code for the location */
  storeCode: z.string().optional(),

  /** Display title of the location */
  title: z.string(),

  /** Website URL */
  websiteUri: z.string().optional(),

  /** Phone numbers */
  phoneNumbers: gmbPhoneNumbersSchema.optional(),

  /** Business categories */
  categories: gmbCategoriesSchema.optional(),

  /** Storefront address */
  storefrontAddress: gmbStorefrontAddressSchema.optional(),

  /** Regular business hours */
  regularHours: gmbRegularHoursSchema.optional(),

  /** Metadata including Maps and review URLs */
  metadata: gmbLocationMetadataSchema.optional(),
});

export type GMBLocationData = z.infer<typeof gmbLocationDataSchema>;
