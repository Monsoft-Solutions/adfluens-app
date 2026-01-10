/**
 * Google Business Profile Account Types
 *
 * Represents GMB accounts and locations for discovery during setup.
 *
 * @module @repo/types/gmb/gmb-account
 */

/**
 * Account type
 */
export type GMBAccountType =
  | "PERSONAL"
  | "LOCATION_GROUP"
  | "USER_GROUP"
  | "ORGANIZATION";

/**
 * Verification state for a location
 */
export type GMBVerificationState =
  | "VERIFIED"
  | "UNVERIFIED"
  | "VERIFICATION_REQUESTED";

/**
 * GMB Account from Account Management API
 */
export type GMBAccount = {
  /** Full resource name (e.g., "accounts/123456789") */
  name: string;

  /** Account name/display name */
  accountName: string;

  /** Account type */
  type: GMBAccountType;

  /** Primary owner email */
  primaryOwner?: string;

  /** Account number (numeric ID) */
  accountNumber?: string;
};

/**
 * GMB Account list response
 */
export type GMBAccountsResponse = {
  /** List of accounts */
  accounts: GMBAccount[];

  /** Token for fetching the next page */
  nextPageToken?: string;
};

/**
 * GMB Location summary for selection
 */
export type GMBLocationSummary = {
  /** Full resource name */
  name: string;

  /** Location ID extracted from name */
  locationId: string;

  /** Business title/name */
  title: string;

  /** Store code */
  storeCode?: string;

  /** Primary phone */
  primaryPhone?: string;

  /** Formatted address */
  formattedAddress?: string;

  /** Verification state */
  verificationState?: GMBVerificationState;

  /** Whether the location has voice of merchant enabled */
  hasVoiceOfMerchant?: boolean;
};

/**
 * GMB Locations list response
 */
export type GMBLocationsResponse = {
  /** List of locations */
  locations: GMBLocationSummary[];

  /** Token for fetching the next page */
  nextPageToken?: string;
};

/**
 * OAuth tokens received after code exchange
 */
export type GMBOAuthTokens = {
  /** Access token for API calls */
  accessToken: string;

  /** Refresh token for getting new access tokens */
  refreshToken?: string;

  /** When the access token expires */
  expiresAt?: Date;

  /** OAuth scope */
  scope?: string;
};
