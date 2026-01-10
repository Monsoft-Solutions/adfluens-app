/**
 * Google Business Profile Account Types
 *
 * Represents GMB accounts and locations for discovery during setup.
 *
 * @module @repo/types/gmb/gmb-account
 */

import { z } from "zod";

/**
 * Account type schema
 */
export const gmbAccountTypeSchema = z.enum([
  "PERSONAL",
  "LOCATION_GROUP",
  "USER_GROUP",
  "ORGANIZATION",
]);

export type GMBAccountType = z.infer<typeof gmbAccountTypeSchema>;

/**
 * Verification state schema
 */
export const gmbVerificationStateSchema = z.enum([
  "VERIFIED",
  "UNVERIFIED",
  "VERIFICATION_REQUESTED",
]);

export type GMBVerificationState = z.infer<typeof gmbVerificationStateSchema>;

/**
 * GMB Account schema
 */
export const gmbAccountSchema = z.object({
  /** Full resource name (e.g., "accounts/123456789") */
  name: z.string(),

  /** Account name/display name */
  accountName: z.string(),

  /** Account type */
  type: gmbAccountTypeSchema,

  /** Primary owner email */
  primaryOwner: z.string().optional(),

  /** Account number (numeric ID) */
  accountNumber: z.string().optional(),
});

export type GMBAccount = z.infer<typeof gmbAccountSchema>;

/**
 * GMB Account list response schema
 */
export const gmbAccountsResponseSchema = z.object({
  /** List of accounts */
  accounts: z.array(gmbAccountSchema),

  /** Token for fetching the next page */
  nextPageToken: z.string().optional(),
});

export type GMBAccountsResponse = z.infer<typeof gmbAccountsResponseSchema>;

/**
 * GMB Location summary schema
 */
export const gmbLocationSummarySchema = z.object({
  /** Full resource name */
  name: z.string(),

  /** Location ID extracted from name */
  locationId: z.string(),

  /** Business title/name */
  title: z.string(),

  /** Store code */
  storeCode: z.string().optional(),

  /** Primary phone */
  primaryPhone: z.string().optional(),

  /** Formatted address */
  formattedAddress: z.string().optional(),

  /** Verification state */
  verificationState: gmbVerificationStateSchema.optional(),

  /** Whether the location has voice of merchant enabled */
  hasVoiceOfMerchant: z.boolean().optional(),
});

export type GMBLocationSummary = z.infer<typeof gmbLocationSummarySchema>;

/**
 * GMB Locations list response schema
 */
export const gmbLocationsResponseSchema = z.object({
  /** List of locations */
  locations: z.array(gmbLocationSummarySchema),

  /** Token for fetching the next page */
  nextPageToken: z.string().optional(),
});

export type GMBLocationsResponse = z.infer<typeof gmbLocationsResponseSchema>;

/**
 * OAuth tokens schema
 */
export const gmbOAuthTokensSchema = z.object({
  /** Access token for API calls */
  accessToken: z.string(),

  /** Refresh token for getting new access tokens */
  refreshToken: z.string().optional(),

  /** When the access token expires */
  expiresAt: z.date().optional(),

  /** OAuth scope */
  scope: z.string().optional(),
});

export type GMBOAuthTokens = z.infer<typeof gmbOAuthTokensSchema>;
