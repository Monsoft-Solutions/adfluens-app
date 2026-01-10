/**
 * Google Business Profile Service
 *
 * Business logic for GMB operations including connection management,
 * reviews, and posts.
 */

import { db, eq, gmbConnectionTable } from "@repo/db";
import type { GmbConnectionRow } from "@repo/db";
import { env } from "@repo/env";
import type { GMBConnection } from "@repo/types/gmb/gmb-connection.type";
import type { GMBLocationData } from "@repo/types/gmb/gmb-location-data.type";
import type {
  GMBAccount,
  GMBLocationSummary,
  GMBOAuthTokens,
} from "@repo/types/gmb/gmb-account.type";
import type { GMBReviewsResponse } from "@repo/types/gmb/gmb-review.type";
import type {
  GMBPost,
  GMBPostsResponse,
  GMBCreatePostInput,
} from "@repo/types/gmb/gmb-post.type";

import {
  getGMBAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken as refreshAccessTokenApi,
  fetchAccounts,
  fetchLocations,
  fetchLocationDetails,
  fetchReviews,
  createReviewReply,
  deleteReviewReply,
  fetchPosts,
  createLocalPost,
  deleteLocalPost,
  GMB_SCOPE,
} from "./gmb-api.utils";

// ============================================================================
// OAuth & Connection Management
// ============================================================================

/**
 * Generate the OAuth URL for connecting GMB
 */
export function getGMBOAuthUrl(
  organizationId: string,
  redirectPath: string = "/settings"
): string {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/gmb/callback`;

  // Encode state with organization ID and redirect path
  const state = Buffer.from(
    JSON.stringify({ organizationId, redirectPath })
  ).toString("base64");

  return getGMBAuthUrl(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
    state
  );
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(
  code: string
): Promise<GMBOAuthTokens> {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/gmb/callback`;

  return exchangeCodeForTokens(
    code,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  organizationId: string
): Promise<string> {
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected for this organization");
  }

  if (connection.status !== "active") {
    throw new Error(
      `GMB connection is ${connection.status}. Please reconnect.`
    );
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiresAt = connection.accessTokenExpiresAt;
  const isExpired =
    !expiresAt || new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000);

  if (isExpired) {
    if (!connection.refreshToken) {
      // Mark connection as error
      await db
        .update(gmbConnectionTable)
        .set({
          status: "error",
          lastError: "Refresh token not available. Please reconnect.",
        })
        .where(eq(gmbConnectionTable.organizationId, organizationId));

      throw new Error("GMB access expired. Please reconnect.");
    }

    try {
      const newTokens = await refreshAccessTokenApi(
        connection.refreshToken,
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );

      // Update database with new tokens
      await db
        .update(gmbConnectionTable)
        .set({
          accessToken: newTokens.accessToken,
          accessTokenExpiresAt: newTokens.expiresAt,
          lastError: null,
        })
        .where(eq(gmbConnectionTable.organizationId, organizationId));

      return newTokens.accessToken;
    } catch (error) {
      // Mark connection as error
      const errorMessage =
        error instanceof Error ? error.message : "Token refresh failed";

      await db
        .update(gmbConnectionTable)
        .set({
          status: "error",
          lastError: errorMessage,
        })
        .where(eq(gmbConnectionTable.organizationId, organizationId));

      throw new Error(`GMB token refresh failed: ${errorMessage}`);
    }
  }

  return connection.accessToken;
}

/**
 * Get GMB connection for an organization
 */
export async function getGMBConnection(
  organizationId: string
): Promise<GMBConnection | null> {
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    return null;
  }

  return mapConnectionToType(connection);
}

/**
 * Create or update GMB connection
 */
export async function createGMBConnection(input: {
  organizationId: string;
  connectedByUserId: string;
  gmbAccountId: string;
  gmbLocationId: string;
  gmbLocationName?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  scope?: string;
  locationData?: GMBLocationData;
}): Promise<GMBConnection> {
  const result = await db
    .insert(gmbConnectionTable)
    .values({
      organizationId: input.organizationId,
      connectedByUserId: input.connectedByUserId,
      gmbAccountId: input.gmbAccountId,
      gmbLocationId: input.gmbLocationId,
      gmbLocationName: input.gmbLocationName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      scope: input.scope || GMB_SCOPE,
      locationData: input.locationData,
      status: "active",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: gmbConnectionTable.organizationId,
      set: {
        connectedByUserId: input.connectedByUserId,
        gmbAccountId: input.gmbAccountId,
        gmbLocationId: input.gmbLocationId,
        gmbLocationName: input.gmbLocationName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        scope: input.scope || GMB_SCOPE,
        locationData: input.locationData,
        status: "active",
        lastError: null,
        lastSyncedAt: new Date(),
      },
    })
    .returning();

  const connection = result[0];
  if (!connection) {
    throw new Error("Failed to create GMB connection");
  }

  return mapConnectionToType(connection);
}

/**
 * Disconnect GMB from an organization
 */
export async function disconnectGMB(organizationId: string): Promise<void> {
  await db
    .delete(gmbConnectionTable)
    .where(eq(gmbConnectionTable.organizationId, organizationId));
}

// ============================================================================
// Account & Location Discovery
// ============================================================================

/**
 * List GMB accounts for a user (using temporary access token)
 */
export async function listGMBAccounts(
  accessToken: string
): Promise<GMBAccount[]> {
  const accounts: GMBAccount[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetchAccounts(accessToken, pageToken);
    accounts.push(...response.accounts);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return accounts;
}

/**
 * List locations for a GMB account (using temporary access token)
 */
export async function listGMBLocations(
  accessToken: string,
  accountName: string
): Promise<GMBLocationSummary[]> {
  const locations: GMBLocationSummary[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetchLocations(accessToken, accountName, pageToken);
    locations.push(...response.locations);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return locations;
}

/**
 * Fetch and cache location details
 */
export async function refreshLocationData(
  organizationId: string
): Promise<GMBLocationData> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  const locationName = `accounts/${connection.gmbAccountId}/locations/${connection.gmbLocationId}`;
  const locationData = await fetchLocationDetails(accessToken, locationName);

  // Update cached data
  await db
    .update(gmbConnectionTable)
    .set({
      locationData,
      gmbLocationName: locationData.title,
      lastSyncedAt: new Date(),
    })
    .where(eq(gmbConnectionTable.organizationId, organizationId));

  return locationData;
}

/**
 * Get location info (from cache or fetch)
 */
export async function getLocationInfo(
  organizationId: string
): Promise<GMBLocationData | null> {
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    return null;
  }

  // Return cached data if available and recent (less than 24 hours old)
  if (connection.locationData && connection.lastSyncedAt) {
    const ageMs = Date.now() - connection.lastSyncedAt.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (ageMs < oneDayMs) {
      return connection.locationData;
    }
  }

  // Fetch fresh data
  try {
    return await refreshLocationData(organizationId);
  } catch (error) {
    // Return cached data on error
    console.error("[gmb] Failed to refresh location data:", error);
    return connection.locationData;
  }
}

// ============================================================================
// Reviews
// ============================================================================

/**
 * List reviews for the connected location
 */
export async function listReviews(
  organizationId: string,
  options?: { pageSize?: number; pageToken?: string }
): Promise<GMBReviewsResponse> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  return fetchReviews(
    accessToken,
    `accounts/${connection.gmbAccountId}`,
    connection.gmbLocationId,
    options
  );
}

/**
 * Reply to a review
 */
export async function replyToReview(
  organizationId: string,
  reviewId: string,
  comment: string
): Promise<void> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  const reviewName = `accounts/${connection.gmbAccountId}/locations/${connection.gmbLocationId}/reviews/${reviewId}`;
  await createReviewReply(accessToken, reviewName, comment);
}

/**
 * Delete a review reply
 */
export async function deleteReply(
  organizationId: string,
  reviewId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  const reviewName = `accounts/${connection.gmbAccountId}/locations/${connection.gmbLocationId}/reviews/${reviewId}`;
  await deleteReviewReply(accessToken, reviewName);
}

// ============================================================================
// Posts
// ============================================================================

/**
 * List posts for the connected location
 */
export async function listPosts(
  organizationId: string,
  options?: { pageSize?: number; pageToken?: string }
): Promise<GMBPostsResponse> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  return fetchPosts(
    accessToken,
    `accounts/${connection.gmbAccountId}`,
    connection.gmbLocationId,
    options
  );
}

/**
 * Create a new post
 */
export async function createPost(
  organizationId: string,
  input: GMBCreatePostInput
): Promise<GMBPost> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  return createLocalPost(
    accessToken,
    `accounts/${connection.gmbAccountId}`,
    connection.gmbLocationId,
    {
      summary: input.summary,
      languageCode: input.languageCode,
      topicType: input.topicType,
      callToAction: input.callToAction,
      media: input.mediaUrls?.map((url: string) => ({
        mediaFormat: "PHOTO" as const,
        sourceUrl: url,
      })),
    }
  );
}

/**
 * Delete a post
 */
export async function deletePost(
  organizationId: string,
  postName: string
): Promise<void> {
  const accessToken = await getValidAccessToken(organizationId);

  await deleteLocalPost(accessToken, postName);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map database row to GMBConnection type
 */
function mapConnectionToType(row: GmbConnectionRow): GMBConnection {
  return {
    id: row.id,
    organizationId: row.organizationId,
    gmbAccountId: row.gmbAccountId,
    gmbLocationId: row.gmbLocationId,
    gmbLocationName: row.gmbLocationName,
    locationData: row.locationData,
    status: row.status as GMBConnection["status"],
    lastSyncedAt: row.lastSyncedAt,
    lastError: row.lastError,
    connectedByUserId: row.connectedByUserId,
    createdAt: row.createdAt,
  };
}
