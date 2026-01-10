/**
 * Google Business Profile API Utilities
 *
 * Low-level API client for interacting with Google Business Profile APIs.
 * Uses the official googleapis package for OAuth and account/location management.
 * Uses direct fetch for reviews and posts (mybusiness v4 API still works but is untyped).
 */

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { GMBLocationData } from "@repo/types/gmb/gmb-location-data.type";
import type {
  GMBAccount,
  GMBAccountsResponse,
  GMBLocationsResponse,
  GMBOAuthTokens,
} from "@repo/types/gmb/gmb-account.type";
import type {
  GMBReview,
  GMBReviewsResponse,
} from "@repo/types/gmb/gmb-review.type";
import type { GMBPost, GMBPostsResponse } from "@repo/types/gmb/gmb-post.type";

// Required scope for GMB API access
export const GMB_SCOPE = "https://www.googleapis.com/auth/business.manage";

// My Business v4 API base URL (for reviews and posts)
const MYBUSINESS_V4_URL = "https://mybusiness.googleapis.com/v4";

// ============================================================================
// OAuth2 Client Factory
// ============================================================================

/**
 * Create an OAuth2 client with the given credentials
 */
export function createOAuth2Client(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): OAuth2Client {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Create an OAuth2 client with existing tokens
 */
export function createOAuth2ClientWithTokens(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  tokens: { access_token: string; refresh_token?: string }
): OAuth2Client {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// ============================================================================
// OAuth Functions
// ============================================================================

/**
 * Generate the OAuth authorization URL for GMB
 */
export function getGMBAuthUrl(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  state: string
): string {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [GMB_SCOPE],
    prompt: "consent", // Force consent to always get refresh token
    state,
  });
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GMBOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    scope: tokens.scope || undefined,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GMBOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, "");
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || "",
    // Refresh token is not returned on refresh, keep the old one
    refreshToken: refreshToken,
    expiresAt: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : undefined,
    scope: credentials.scope || undefined,
  };
}

// ============================================================================
// Account & Location Discovery (using googleapis)
// ============================================================================

/**
 * List GMB accounts the user has access to
 */
export async function fetchAccounts(
  accessToken: string,
  pageToken?: string
): Promise<GMBAccountsResponse> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });

  const response = await mybusinessaccountmanagement.accounts.list({
    pageToken: pageToken || undefined,
  });

  const accounts = response.data.accounts || [];

  return {
    accounts: accounts.map((acc) => ({
      name: acc.name || "",
      accountName: acc.accountName || "",
      type: (acc.type || "PERSONAL") as GMBAccount["type"],
      primaryOwner: acc.primaryOwner || undefined,
      accountNumber: acc.accountNumber || undefined,
    })),
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * List locations for a GMB account
 */
export async function fetchLocations(
  accessToken: string,
  accountName: string,
  pageToken?: string
): Promise<GMBLocationsResponse> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
    version: "v1",
    auth: oauth2Client,
  });

  const response = await mybusinessbusinessinformation.accounts.locations.list({
    parent: accountName,
    readMask:
      "name,title,storeCode,storefrontAddress,phoneNumbers.primaryPhone,metadata",
    pageToken: pageToken || undefined,
  });

  const locations = response.data.locations || [];

  return {
    locations: locations.map((loc) => {
      // Extract location ID from the full resource name
      const locationId = (loc.name || "").split("/").pop() || "";

      // Format address for display
      const addr = loc.storefrontAddress;
      const addressParts = [
        ...(addr?.addressLines || []),
        addr?.locality,
        addr?.administrativeArea,
        addr?.postalCode,
      ].filter(Boolean);

      return {
        name: loc.name || "",
        locationId,
        title: loc.title || "",
        storeCode: loc.storeCode || undefined,
        primaryPhone: loc.phoneNumbers?.primaryPhone || undefined,
        formattedAddress: addressParts.join(", ") || undefined,
        hasVoiceOfMerchant: loc.metadata?.hasVoiceOfMerchant || undefined,
      };
    }),
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Fetch detailed location information
 */
export async function fetchLocationDetails(
  accessToken: string,
  locationName: string
): Promise<GMBLocationData> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
    version: "v1",
    auth: oauth2Client,
  });

  const response = await mybusinessbusinessinformation.locations.get({
    name: locationName,
    readMask:
      "name,storeCode,title,websiteUri,phoneNumbers,categories,storefrontAddress,regularHours,metadata",
  });

  const loc = response.data;

  return {
    name: loc.name || "",
    storeCode: loc.storeCode || undefined,
    title: loc.title || "",
    websiteUri: loc.websiteUri || undefined,
    phoneNumbers: loc.phoneNumbers
      ? {
          primaryPhone: loc.phoneNumbers.primaryPhone || undefined,
          additionalPhones: loc.phoneNumbers.additionalPhones || undefined,
        }
      : undefined,
    categories: loc.categories
      ? {
          primaryCategory: loc.categories.primaryCategory
            ? {
                name: loc.categories.primaryCategory.name || "",
                displayName: loc.categories.primaryCategory.displayName || "",
              }
            : undefined,
          additionalCategories: loc.categories.additionalCategories?.map(
            (cat) => ({
              name: cat.name || "",
              displayName: cat.displayName || "",
            })
          ),
        }
      : undefined,
    storefrontAddress: loc.storefrontAddress
      ? {
          addressLines: loc.storefrontAddress.addressLines || undefined,
          locality: loc.storefrontAddress.locality || undefined,
          administrativeArea:
            loc.storefrontAddress.administrativeArea || undefined,
          postalCode: loc.storefrontAddress.postalCode || undefined,
          regionCode: loc.storefrontAddress.regionCode || undefined,
        }
      : undefined,
    regularHours: loc.regularHours?.periods
      ? {
          periods: loc.regularHours.periods.map((p) => ({
            openDay: p.openDay || "",
            openTime: `${String(p.openTime?.hours || 0).padStart(2, "0")}:${String(p.openTime?.minutes || 0).padStart(2, "0")}`,
            closeDay: p.closeDay || "",
            closeTime: `${String(p.closeTime?.hours || 0).padStart(2, "0")}:${String(p.closeTime?.minutes || 0).padStart(2, "0")}`,
          })),
        }
      : undefined,
    metadata: loc.metadata
      ? {
          mapsUri: loc.metadata.mapsUri || undefined,
          newReviewUri: loc.metadata.newReviewUri || undefined,
        }
      : undefined,
  };
}

// ============================================================================
// Generic Fetch Helper (for v4 API endpoints)
// ============================================================================

/**
 * Generic fetch wrapper for GMB API calls with authentication
 */
async function gmbFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `GMB API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage =
        errorJson.error?.message || errorJson.message || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g., DELETE operations)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ============================================================================
// Reviews API (using direct fetch - v4 API)
// ============================================================================

/**
 * Raw review response from GMB API
 */
type GMBReviewApiResponse = {
  name: string;
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
    isAnonymous: boolean;
  };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
};

/**
 * Fetch reviews for a location
 */
export async function fetchReviews(
  accessToken: string,
  accountName: string,
  locationId: string,
  options?: { pageSize?: number; pageToken?: string }
): Promise<GMBReviewsResponse> {
  const params = new URLSearchParams();
  if (options?.pageSize) {
    params.set("pageSize", String(options.pageSize));
  }
  if (options?.pageToken) {
    params.set("pageToken", options.pageToken);
  }

  const url = `${MYBUSINESS_V4_URL}/${accountName}/locations/${locationId}/reviews${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await gmbFetch<{
    reviews?: GMBReviewApiResponse[];
    nextPageToken?: string;
    averageRating?: number;
    totalReviewCount?: number;
  }>(url, accessToken);

  return {
    reviews: (response.reviews || []).map((review) => ({
      name: review.name,
      reviewId: review.reviewId,
      reviewer: review.reviewer,
      starRating: review.starRating as GMBReview["starRating"],
      comment: review.comment,
      createTime: review.createTime,
      updateTime: review.updateTime,
      reviewReply: review.reviewReply,
    })),
    nextPageToken: response.nextPageToken,
    averageRating: response.averageRating,
    totalReviewCount: response.totalReviewCount,
  };
}

/**
 * Reply to a review
 */
export async function createReviewReply(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<void> {
  const url = `${MYBUSINESS_V4_URL}/${reviewName}/reply`;

  await gmbFetch(url, accessToken, {
    method: "PUT",
    body: JSON.stringify({ comment }),
  });
}

/**
 * Delete a review reply
 */
export async function deleteReviewReply(
  accessToken: string,
  reviewName: string
): Promise<void> {
  const url = `${MYBUSINESS_V4_URL}/${reviewName}/reply`;

  await gmbFetch(url, accessToken, {
    method: "DELETE",
  });
}

// ============================================================================
// Posts API (using direct fetch - v4 API)
// ============================================================================

/**
 * Raw post response from GMB API
 */
type GMBPostApiResponse = {
  name: string;
  languageCode: string;
  summary: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  media?: Array<{
    mediaFormat: string;
    sourceUrl: string;
  }>;
  topicType: string;
  createTime: string;
  updateTime: string;
  state: string;
  event?: {
    title?: string;
    schedule?: {
      startDate?: { year: number; month: number; day: number };
      endDate?: { year: number; month: number; day: number };
      startTime?: { hours: number; minutes: number };
      endTime?: { hours: number; minutes: number };
    };
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
};

/**
 * Fetch local posts for a location
 */
export async function fetchPosts(
  accessToken: string,
  accountName: string,
  locationId: string,
  options?: { pageSize?: number; pageToken?: string }
): Promise<GMBPostsResponse> {
  const params = new URLSearchParams();
  if (options?.pageSize) {
    params.set("pageSize", String(options.pageSize));
  }
  if (options?.pageToken) {
    params.set("pageToken", options.pageToken);
  }

  const url = `${MYBUSINESS_V4_URL}/${accountName}/locations/${locationId}/localPosts${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await gmbFetch<{
    localPosts?: GMBPostApiResponse[];
    nextPageToken?: string;
  }>(url, accessToken);

  return {
    posts: (response.localPosts || []).map((post) => ({
      name: post.name,
      languageCode: post.languageCode,
      summary: post.summary,
      callToAction: post.callToAction as GMBPost["callToAction"],
      media: post.media as GMBPost["media"],
      topicType: post.topicType as GMBPost["topicType"],
      createTime: post.createTime,
      updateTime: post.updateTime,
      state: post.state as GMBPost["state"],
      event: post.event
        ? {
            title: post.event.title,
            startDate: post.event.schedule?.startDate,
            endDate: post.event.schedule?.endDate,
            startTime: post.event.schedule?.startTime,
            endTime: post.event.schedule?.endTime,
          }
        : undefined,
      offer: post.offer,
    })),
    nextPageToken: response.nextPageToken,
  };
}

/**
 * Create a new local post
 */
export async function createLocalPost(
  accessToken: string,
  accountName: string,
  locationId: string,
  post: {
    summary: string;
    languageCode?: string;
    topicType?: GMBPost["topicType"];
    callToAction?: GMBPost["callToAction"];
    media?: Array<{ mediaFormat: string; sourceUrl: string }>;
  }
): Promise<GMBPost> {
  const url = `${MYBUSINESS_V4_URL}/${accountName}/locations/${locationId}/localPosts`;

  const body = {
    summary: post.summary,
    languageCode: post.languageCode || "en",
    topicType: post.topicType || "STANDARD",
    callToAction: post.callToAction,
    media: post.media,
  };

  const response = await gmbFetch<GMBPostApiResponse>(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    name: response.name,
    languageCode: response.languageCode,
    summary: response.summary,
    callToAction: response.callToAction as GMBPost["callToAction"],
    media: response.media as GMBPost["media"],
    topicType: response.topicType as GMBPost["topicType"],
    createTime: response.createTime,
    updateTime: response.updateTime,
    state: response.state as GMBPost["state"],
  };
}

/**
 * Delete a local post
 */
export async function deleteLocalPost(
  accessToken: string,
  postName: string
): Promise<void> {
  const url = `${MYBUSINESS_V4_URL}/${postName}`;

  await gmbFetch(url, accessToken, {
    method: "DELETE",
  });
}
