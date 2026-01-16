/**
 * Google Business Profile Service
 *
 * Business logic for GMB operations including connection management,
 * reviews, and posts.
 *
 * Uses the shared Google connection for OAuth tokens.
 */

import { db, eq, and, googleConnectionTable, gmbLocationTable } from "@repo/db";
import type { GmbLocationRow, GoogleConnectionRow } from "@repo/db";
import type { GMBConnection } from "@repo/types/gmb/gmb-connection.type";
import type { GMBLocationData } from "@repo/types/gmb/gmb-location-data.type";
import type {
  GMBAccount,
  GMBLocationSummary,
} from "@repo/types/gmb/gmb-account.type";
import type { GMBReviewsResponse } from "@repo/types/gmb/gmb-review.type";
import type {
  GMBPost,
  GMBPostsResponse,
  GMBCreatePostInput,
} from "@repo/types/gmb/gmb-post.type";

import {
  getValidAccessTokenForService,
  getPendingGoogleConnection,
  activateConnection,
  getGoogleConnectionRow,
} from "../google/google.service";

import {
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
} from "./gmb-api.utils";
import type {
  GMBPerformanceData,
  GMBPerformanceMetrics,
} from "@repo/types/gmb/gmb-performance.type";
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

/** Cache duration for location data (24 hours) */
const LOCATION_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Pending Connection Management (Secure OAuth Flow)
// ============================================================================

/**
 * Get a pending connection for GMB setup (uses shared Google connection)
 */
export async function getPendingGMBConnection(
  connectionId: string,
  userId: string
): Promise<GoogleConnectionRow | null> {
  return getPendingGoogleConnection(connectionId, userId);
}

/**
 * Get a connection for GMB setup - works with both pending and active connections.
 * This allows users to select a location when they already have an active Google connection.
 */
export async function getConnectionForGMBSetup(
  connectionId: string,
  userId: string
): Promise<GoogleConnectionRow | null> {
  // First try to get a pending connection
  const pending = await getPendingGoogleConnection(connectionId, userId);
  if (pending) {
    return pending;
  }

  // If not pending, try to get an active connection by ID
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.id, connectionId),
  });

  if (!connection) {
    return null;
  }

  // Validate the connection belongs to this user and is active
  if (connection.connectedByUserId !== userId) {
    return null;
  }

  if (connection.status !== "active") {
    return null;
  }

  return connection;
}

/**
 * Complete GMB connection setup by setting the account/location details.
 * Works with both pending and active connections.
 */
export async function completePendingGMBConnection(input: {
  connectionId: string;
  userId: string;
  gmbAccountId: string;
  gmbLocationId: string;
  gmbLocationName?: string;
  locationData?: GMBLocationData;
}): Promise<GMBConnection> {
  // Get the connection (works with both pending and active)
  const existingConnection = await getConnectionForGMBSetup(
    input.connectionId,
    input.userId
  );
  if (!existingConnection) {
    throw new Error("Connection not found or expired");
  }

  let connection: GoogleConnectionRow;

  if (existingConnection.status === "pending") {
    // Activate the pending connection and enable GMB service
    connection = await activateConnection(input.connectionId, "gmb");
  } else {
    // For active connections, just enable GMB service
    const currentServices = existingConnection.enabledServices || [];
    const updatedServices = currentServices.includes("gmb")
      ? currentServices
      : ([...currentServices, "gmb"] as typeof currentServices);

    const result = await db
      .update(googleConnectionTable)
      .set({ enabledServices: updatedServices })
      .where(eq(googleConnectionTable.id, input.connectionId))
      .returning();

    connection = result[0]!;
  }

  // Delete any existing GMB locations for this organization
  await db
    .delete(gmbLocationTable)
    .where(eq(gmbLocationTable.organizationId, connection.organizationId));

  // Create the selected location as active
  await db.insert(gmbLocationTable).values({
    googleConnectionId: connection.id,
    organizationId: connection.organizationId,
    gmbAccountId: input.gmbAccountId,
    gmbLocationId: input.gmbLocationId,
    locationName: input.gmbLocationName,
    isActive: true,
    locationData: input.locationData,
    status: "active",
    lastSyncedAt: new Date(),
  });

  return mapConnectionToGMBType(connection, {
    gmbAccountId: input.gmbAccountId,
    gmbLocationId: input.gmbLocationId,
    gmbLocationName: input.gmbLocationName,
    locationData: input.locationData,
  });
}

// ============================================================================
// Connection Status
// ============================================================================

/**
 * Get GMB connection for an organization
 */
export async function getGMBConnection(
  organizationId: string
): Promise<GMBConnection | null> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    return null;
  }

  // Check if GMB is enabled
  if (!connection.enabledServices.includes("gmb")) {
    return null;
  }

  // Get the active location
  const location = await getActiveLocation(organizationId);

  if (!location) {
    return null;
  }

  return mapConnectionToGMBType(connection, {
    gmbAccountId: location.gmbAccountId,
    gmbLocationId: location.gmbLocationId,
    gmbLocationName: location.locationName,
    locationData: location.locationData,
    lastSyncedAt: location.lastSyncedAt,
  });
}

/**
 * Get the active GMB location for an organization
 */
export async function getActiveLocation(
  organizationId: string
): Promise<GmbLocationRow | null> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection || !connection.enabledServices.includes("gmb")) {
    return null;
  }

  const location = await db.query.gmbLocationTable.findFirst({
    where: and(
      eq(gmbLocationTable.googleConnectionId, connection.id),
      eq(gmbLocationTable.isActive, true)
    ),
  });

  return location || null;
}

/**
 * Disconnect GMB from an organization (disables service, removes locations)
 */
export async function disconnectGMB(organizationId: string): Promise<void> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    return;
  }

  // Delete all GMB locations for this connection
  await db
    .delete(gmbLocationTable)
    .where(eq(gmbLocationTable.googleConnectionId, connection.id));

  // Disable GMB service on the connection
  const updatedServices = connection.enabledServices.filter((s) => s !== "gmb");

  await db
    .update(googleConnectionTable)
    .set({ enabledServices: updatedServices })
    .where(eq(googleConnectionTable.organizationId, organizationId));
}

// ============================================================================
// Account & Location Discovery
// ============================================================================

/**
 * List GMB accounts for a user (using pending connection token)
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
 * List locations for a GMB account (using pending connection token)
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  const locationData = await fetchLocationDetails(
    accessToken,
    buildLocationName(location)
  );

  // Update cached data
  await db
    .update(gmbLocationTable)
    .set({
      locationData,
      locationName: locationData.title,
      lastSyncedAt: new Date(),
    })
    .where(eq(gmbLocationTable.id, location.id));

  return locationData;
}

/**
 * Get location info (from cache or fetch)
 */
export async function getLocationInfo(
  organizationId: string
): Promise<GMBLocationData | null> {
  const location = await getActiveLocation(organizationId);

  if (!location) {
    return null;
  }

  // Return cached data if available and recent
  if (location.locationData && location.lastSyncedAt) {
    const ageMs = Date.now() - location.lastSyncedAt.getTime();

    if (ageMs < LOCATION_CACHE_DURATION_MS) {
      return location.locationData;
    }
  }

  // Fetch fresh data
  try {
    return await refreshLocationData(organizationId);
  } catch (error) {
    // Return cached data on error
    console.error("[gmb] Failed to refresh location data:", error);
    return location.locationData;
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  return fetchReviews(
    accessToken,
    buildAccountName(location),
    location.gmbLocationId,
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  await createReviewReply(
    accessToken,
    buildReviewName(location, reviewId),
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  await deleteReviewReply(accessToken, buildReviewName(location, reviewId));
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  return fetchPosts(
    accessToken,
    buildAccountName(location),
    location.gmbLocationId,
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  return createLocalPost(
    accessToken,
    buildAccountName(location),
    location.gmbLocationId,
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
  const accessToken = await getValidAccessTokenForService(
    organizationId,
    "gmb"
  );

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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

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
  const locationName = `locations/${location.gmbLocationId}`;

  // Initialize empty metrics for graceful degradation
  let metrics: GMBPerformanceMetrics = {
    searchImpressionsMaps: [],
    searchImpressionsSearch: [],
    websiteClicks: [],
    phoneClicks: [],
    directionRequests: [],
  };

  // Fetch daily metrics with error handling
  try {
    metrics = await fetchPerformanceMetrics(
      accessToken,
      locationName,
      startDateStr,
      endDateStr
    );
  } catch (error) {
    // Log the error but don't fail the request - return empty metrics instead
    console.error("[gmb] Failed to fetch performance metrics:", error);
  }

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
  // Get the location
  const location = await getActiveLocation(organizationId);

  if (!location) {
    throw new Error("GMB not connected");
  }

  const businessName =
    location.locationName || location.locationData?.title || "our business";

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
  // Get the location
  const location = await getActiveLocation(organizationId);

  if (!location) {
    throw new Error("GMB not connected");
  }

  const businessName =
    location.locationName || location.locationData?.title || "our business";

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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  return fetchMedia(
    accessToken,
    buildAccountName(location),
    location.gmbLocationId,
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
  const { location, accessToken } =
    await getValidLocationWithToken(organizationId);

  return uploadMediaFromUrl(
    accessToken,
    buildAccountName(location),
    location.gmbLocationId,
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
  const accessToken = await getValidAccessTokenForService(
    organizationId,
    "gmb"
  );

  await deleteMediaApi(accessToken, mediaName);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get a valid location with access token for an organization.
 * Consolidates the common pattern of validating token and fetching location.
 */
async function getValidLocationWithToken(organizationId: string): Promise<{
  location: GmbLocationRow;
  accessToken: string;
}> {
  const accessToken = await getValidAccessTokenForService(
    organizationId,
    "gmb"
  );
  const location = await getActiveLocation(organizationId);

  if (!location) {
    throw new Error("GMB not connected");
  }

  return { location, accessToken };
}

/**
 * Build the full location resource name for GMB API calls.
 */
function buildLocationName(location: GmbLocationRow): string {
  return `accounts/${location.gmbAccountId}/locations/${location.gmbLocationId}`;
}

/**
 * Build the full account resource name for GMB API calls.
 */
function buildAccountName(location: GmbLocationRow): string {
  return `accounts/${location.gmbAccountId}`;
}

/**
 * Build the full review resource name for GMB API calls.
 */
function buildReviewName(location: GmbLocationRow, reviewId: string): string {
  return `${buildLocationName(location)}/reviews/${reviewId}`;
}

/**
 * Map database rows to GMBConnection type
 */
function mapConnectionToGMBType(
  row: GoogleConnectionRow,
  locationData: {
    gmbAccountId: string;
    gmbLocationId: string;
    gmbLocationName?: string | null;
    locationData?: GMBLocationData | null;
    lastSyncedAt?: Date | null;
  }
): GMBConnection {
  return {
    id: row.id,
    organizationId: row.organizationId,
    gmbAccountId: locationData.gmbAccountId,
    gmbLocationId: locationData.gmbLocationId,
    gmbLocationName: locationData.gmbLocationName ?? null,
    locationData: locationData.locationData ?? null,
    status: row.status as GMBConnection["status"],
    lastSyncedAt: locationData.lastSyncedAt ?? null,
    lastError: row.lastError,
    connectedByUserId: row.connectedByUserId,
    createdAt: row.createdAt,
  };
}
