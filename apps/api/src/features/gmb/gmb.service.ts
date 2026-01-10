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
  fetchPerformanceMetrics,
  fetchSearchKeywords,
  fetchMedia,
  uploadMediaFromUrl,
  deleteMedia as deleteMediaApi,
  GMB_SCOPE,
} from "./gmb-api.utils";
import type { GMBPerformanceData } from "@repo/types/gmb/gmb-performance.type";
import type {
  GMBReviewAnalysis,
  GMBReplyTone,
} from "@repo/types/gmb/gmb-review.type";
import {
  generateReviewReply as generateReviewReplyAI,
  analyzeReview as analyzeReviewAI,
} from "./gmb-ai.utils";
import type {
  GMBMediaResponse,
  GMBMediaItem,
  GMBMediaCategory,
} from "@repo/types/gmb/gmb-media.type";

// ============================================================================
// Constants
// ============================================================================

/** Buffer time before token expiration to trigger refresh (5 minutes) */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Cache duration for location data (24 hours) */
const LOCATION_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// OAuth & Connection Management
// ============================================================================

/**
 * Generate the OAuth URL for connecting GMB
 */
export function getGMBOAuthUrl(
  organizationId: string,
  userId: string,
  redirectPath: string = "/settings"
): string {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/gmb/callback`;

  // Encode state with organization ID, user ID, and redirect path
  const state = Buffer.from(
    JSON.stringify({ organizationId, userId, redirectPath })
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

// ============================================================================
// Pending Connection Management (Secure OAuth Flow)
// ============================================================================

/**
 * Create a pending GMB connection to store OAuth tokens securely.
 * This prevents tokens from being exposed in URL parameters.
 * The connection remains "pending" until the user selects a location.
 */
export async function createPendingGMBConnection(input: {
  organizationId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  scope?: string;
}): Promise<GmbConnectionRow> {
  // Delete any existing connection for this organization (will be replaced)
  await db
    .delete(gmbConnectionTable)
    .where(eq(gmbConnectionTable.organizationId, input.organizationId));

  const result = await db
    .insert(gmbConnectionTable)
    .values({
      organizationId: input.organizationId,
      connectedByUserId: input.userId,
      // Placeholder values for required fields - will be set when location is selected
      gmbAccountId: "pending",
      gmbLocationId: "pending",
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      scope: input.scope || GMB_SCOPE,
      status: "pending",
    })
    .returning();

  const connection = result[0];
  if (!connection) {
    throw new Error("Failed to create pending GMB connection");
  }

  return connection;
}

/**
 * Get a pending connection by ID, validating it belongs to the user.
 */
export async function getPendingGMBConnection(
  connectionId: string,
  userId: string
): Promise<GmbConnectionRow | null> {
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.id, connectionId),
  });

  if (!connection) {
    return null;
  }

  // Validate the connection belongs to this user
  if (connection.connectedByUserId !== userId) {
    return null;
  }

  // Only return if it's in pending status
  if (connection.status !== "pending") {
    return null;
  }

  return connection;
}

/**
 * Complete a pending connection by setting the account/location details.
 */
export async function completePendingGMBConnection(input: {
  connectionId: string;
  userId: string;
  gmbAccountId: string;
  gmbLocationId: string;
  gmbLocationName?: string;
  locationData?: GMBLocationData;
}): Promise<GMBConnection> {
  // Verify the pending connection exists and belongs to user
  const pending = await getPendingGMBConnection(
    input.connectionId,
    input.userId
  );
  if (!pending) {
    throw new Error("Pending connection not found or expired");
  }

  const result = await db
    .update(gmbConnectionTable)
    .set({
      gmbAccountId: input.gmbAccountId,
      gmbLocationId: input.gmbLocationId,
      gmbLocationName: input.gmbLocationName,
      locationData: input.locationData,
      status: "active",
      lastSyncedAt: new Date(),
    })
    .where(eq(gmbConnectionTable.id, input.connectionId))
    .returning();

  const connection = result[0];
  if (!connection) {
    throw new Error("Failed to complete GMB connection");
  }

  return mapConnectionToType(connection);
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

  // Check if token is expired or about to expire
  const expiresAt = connection.accessTokenExpiresAt;
  const isExpired =
    !expiresAt ||
    new Date() >= new Date(expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS);

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
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  const locationData = await fetchLocationDetails(
    accessToken,
    buildLocationName(connection)
  );

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

  // Return cached data if available and recent
  if (connection.locationData && connection.lastSyncedAt) {
    const ageMs = Date.now() - connection.lastSyncedAt.getTime();

    if (ageMs < LOCATION_CACHE_DURATION_MS) {
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
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  return fetchReviews(
    accessToken,
    buildAccountName(connection),
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
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  await createReviewReply(
    accessToken,
    buildReviewName(connection, reviewId),
    comment
  );
}

/**
 * Delete a review reply
 */
export async function deleteReply(
  organizationId: string,
  reviewId: string
): Promise<void> {
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  await deleteReviewReply(accessToken, buildReviewName(connection, reviewId));
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
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  return fetchPosts(
    accessToken,
    buildAccountName(connection),
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
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  return createLocalPost(
    accessToken,
    buildAccountName(connection),
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
// Performance Analytics
// ============================================================================

/**
 * Get performance metrics for the connected location
 */
export async function getPerformanceMetrics(
  organizationId: string,
  days: number = 30
): Promise<GMBPerformanceData> {
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Format dates as YYYY-MM-DD
  const formatDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  // Build the location name for Performance API (uses locations/ prefix)
  const locationName = `locations/${connection.gmbLocationId}`;

  // Fetch daily metrics
  const metrics = await fetchPerformanceMetrics(
    accessToken,
    locationName,
    startDateStr,
    endDateStr
  );

  // Fetch search keywords for current month
  const currentYearMonth = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}`;
  let searchKeywords: GMBPerformanceData["searchKeywords"] = [];

  try {
    searchKeywords = await fetchSearchKeywords(
      accessToken,
      locationName,
      currentYearMonth
    );
  } catch (error) {
    // Keywords API may fail if no data or not enough impressions
    console.warn("[gmb] Failed to fetch search keywords:", error);
  }

  // Calculate totals
  const sumValues = (arr: Array<{ value: number }>) =>
    arr.reduce((sum, item) => sum + item.value, 0);

  const totalImpressions =
    sumValues(metrics.searchImpressionsMaps) +
    sumValues(metrics.searchImpressionsSearch);

  return {
    metrics,
    searchKeywords,
    dateRange: {
      startDate: startDateStr,
      endDate: endDateStr,
    },
    totals: {
      totalImpressions,
      totalWebsiteClicks: sumValues(metrics.websiteClicks),
      totalPhoneClicks: sumValues(metrics.phoneClicks),
      totalDirectionRequests: sumValues(metrics.directionRequests),
    },
  };
}

// ============================================================================
// AI Review Responses
// ============================================================================

/**
 * Generate an AI-suggested reply for a specific review
 */
export async function generateReplySuggestion(
  organizationId: string,
  reviewId: string,
  tone?: GMBReplyTone
): Promise<string> {
  // Get the connection and location data
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  const businessName =
    connection.gmbLocationName ||
    connection.locationData?.title ||
    "our business";

  // Fetch the specific review
  const reviewsResponse = await listReviews(organizationId);
  const review = reviewsResponse.reviews.find((r) => r.reviewId === reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  return generateReviewReplyAI(review, businessName, tone);
}

/**
 * Analyze a specific review for sentiment and suggestions
 */
export async function analyzeReviewSentiment(
  organizationId: string,
  reviewId: string
): Promise<GMBReviewAnalysis> {
  // Get the connection and location data
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  const businessName =
    connection.gmbLocationName ||
    connection.locationData?.title ||
    "our business";

  // Fetch the specific review
  const reviewsResponse = await listReviews(organizationId);
  const review = reviewsResponse.reviews.find((r) => r.reviewId === reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  return analyzeReviewAI(review, businessName);
}

// ============================================================================
// Media Management
// ============================================================================

/**
 * List media items for the connected location
 */
export async function listMedia(
  organizationId: string,
  pageToken?: string
): Promise<GMBMediaResponse> {
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  return fetchMedia(
    accessToken,
    buildAccountName(connection),
    connection.gmbLocationId,
    pageToken
  );
}

/**
 * Upload media from a URL
 */
export async function uploadMedia(
  organizationId: string,
  sourceUrl: string,
  category: GMBMediaCategory,
  description?: string
): Promise<GMBMediaItem> {
  const { connection, accessToken } =
    await getValidConnectionWithToken(organizationId);

  return uploadMediaFromUrl(
    accessToken,
    buildAccountName(connection),
    connection.gmbLocationId,
    sourceUrl,
    category,
    description
  );
}

/**
 * Delete a media item
 */
export async function deleteMediaItem(
  organizationId: string,
  mediaName: string
): Promise<void> {
  const accessToken = await getValidAccessToken(organizationId);

  await deleteMediaApi(accessToken, mediaName);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get a valid connection with access token for an organization.
 * Consolidates the common pattern of validating token and fetching connection.
 */
async function getValidConnectionWithToken(organizationId: string): Promise<{
  connection: GmbConnectionRow;
  accessToken: string;
}> {
  const accessToken = await getValidAccessToken(organizationId);
  const connection = await db.query.gmbConnectionTable.findFirst({
    where: eq(gmbConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GMB not connected");
  }

  return { connection, accessToken };
}

/**
 * Build the full location resource name for GMB API calls.
 */
function buildLocationName(connection: GmbConnectionRow): string {
  return `accounts/${connection.gmbAccountId}/locations/${connection.gmbLocationId}`;
}

/**
 * Build the full account resource name for GMB API calls.
 */
function buildAccountName(connection: GmbConnectionRow): string {
  return `accounts/${connection.gmbAccountId}`;
}

/**
 * Build the full review resource name for GMB API calls.
 */
function buildReviewName(
  connection: GmbConnectionRow,
  reviewId: string
): string {
  return `${buildLocationName(connection)}/reviews/${reviewId}`;
}

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
