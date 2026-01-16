/**
 * Google Analytics Service
 *
 * Business logic for GA4 operations including connection management
 * and analytics data fetching.
 */

import { db, eq, and, gaConnectionTable, gaPropertyTable } from "@repo/db";
import type { GaConnectionRow, GaPropertyRow } from "@repo/db";
import { env } from "@repo/env";

import {
  getGAAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken as refreshAccessTokenApi,
  fetchUserInfo,
  fetchGA4Properties,
  fetchGA4Property,
  fetchGA4TrafficMetrics,
  fetchGA4TopPages,
  fetchGA4TrafficSources,
  GA_SCOPE,
} from "./ga-api.utils";
import type {
  GAOAuthTokens,
  GA4Property,
  GA4TrafficData,
} from "./ga-api.utils";

// ============================================================================
// Types
// ============================================================================

export type GAConnection = {
  id: string;
  organizationId: string;
  googleAccountId: string;
  googleEmail?: string | null;
  status: "active" | "pending" | "disconnected" | "error";
  lastError?: string | null;
  lastValidatedAt?: Date | null;
  connectedByUserId: string;
  createdAt: Date;
  properties?: GAPropertySummary[];
};

export type GAPropertySummary = {
  id: string;
  propertyId: string;
  propertyName: string;
  isActive: boolean;
  status: string;
};

// ============================================================================
// Constants
// ============================================================================

/** Buffer time before token expiration to trigger refresh (5 minutes) */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ============================================================================
// OAuth & Connection Management
// ============================================================================

/**
 * Generate the OAuth URL for connecting Google Analytics
 */
export function getGAOAuthUrl(
  organizationId: string,
  userId: string,
  redirectPath: string = "/analytics"
): string {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/ga/callback`;

  // Encode state with organization ID, user ID, and redirect path
  const state = Buffer.from(
    JSON.stringify({ organizationId, userId, redirectPath })
  ).toString("base64");

  return getGAAuthUrl(
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
): Promise<GAOAuthTokens> {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/ga/callback`;

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
 * Create a pending GA connection to store OAuth tokens securely.
 * This prevents tokens from being exposed in URL parameters.
 * The connection remains "pending" until the user selects a property.
 */
export async function createPendingGAConnection(input: {
  organizationId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  scope?: string;
}): Promise<GaConnectionRow> {
  // First, get user info from Google
  const userInfo = await fetchUserInfo(input.accessToken);

  // Delete any existing connection for this organization (will be replaced)
  await db
    .delete(gaConnectionTable)
    .where(eq(gaConnectionTable.organizationId, input.organizationId));

  const result = await db
    .insert(gaConnectionTable)
    .values({
      organizationId: input.organizationId,
      connectedByUserId: input.userId,
      googleAccountId: userInfo.id,
      googleEmail: userInfo.email,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      scope: input.scope || GA_SCOPE,
      status: "pending",
    })
    .returning();

  const connection = result[0];
  if (!connection) {
    throw new Error("Failed to create pending GA connection");
  }

  return connection;
}

/**
 * Get a pending connection by ID, validating it belongs to the user.
 */
export async function getPendingGAConnection(
  connectionId: string,
  userId: string
): Promise<GaConnectionRow | null> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.id, connectionId),
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
 * List available GA4 properties for a pending connection
 */
export async function listPropertiesForPendingConnection(
  connectionId: string,
  userId: string
): Promise<GA4Property[]> {
  const connection = await getPendingGAConnection(connectionId, userId);
  if (!connection) {
    throw new Error("Pending connection not found or expired");
  }

  return fetchGA4Properties(connection.accessToken);
}

/**
 * Complete a pending connection by selecting a GA4 property
 */
export async function completePendingGAConnection(input: {
  connectionId: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  propertyData?: GA4Property;
}): Promise<GAConnection> {
  // Verify the pending connection exists and belongs to user
  const pending = await getPendingGAConnection(
    input.connectionId,
    input.userId
  );
  if (!pending) {
    throw new Error("Pending connection not found or expired");
  }

  // Update connection to active
  const connectionResult = await db
    .update(gaConnectionTable)
    .set({
      status: "active",
      lastValidatedAt: new Date(),
    })
    .where(eq(gaConnectionTable.id, input.connectionId))
    .returning();

  const connection = connectionResult[0];
  if (!connection) {
    throw new Error("Failed to complete GA connection");
  }

  // Delete any existing properties for this connection
  await db
    .delete(gaPropertyTable)
    .where(eq(gaPropertyTable.gaConnectionId, connection.id));

  // Create the selected property as active
  await db.insert(gaPropertyTable).values({
    gaConnectionId: connection.id,
    organizationId: connection.organizationId,
    propertyId: input.propertyId,
    propertyName: input.propertyName,
    isActive: true,
    propertyData: input.propertyData || null,
    status: "active",
    lastSyncedAt: new Date(),
  });

  return mapConnectionToType(connection);
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  organizationId: string
): Promise<string> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("Google Analytics not connected for this organization");
  }

  if (connection.status !== "active") {
    throw new Error(`GA connection is ${connection.status}. Please reconnect.`);
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
        .update(gaConnectionTable)
        .set({
          status: "error",
          lastError: "Refresh token not available. Please reconnect.",
        })
        .where(eq(gaConnectionTable.organizationId, organizationId));

      throw new Error("GA access expired. Please reconnect.");
    }

    try {
      const newTokens = await refreshAccessTokenApi(
        connection.refreshToken,
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );

      // Update database with new tokens
      await db
        .update(gaConnectionTable)
        .set({
          accessToken: newTokens.accessToken,
          accessTokenExpiresAt: newTokens.expiresAt,
          lastError: null,
        })
        .where(eq(gaConnectionTable.organizationId, organizationId));

      return newTokens.accessToken;
    } catch (error) {
      // Mark connection as error
      const errorMessage =
        error instanceof Error ? error.message : "Token refresh failed";

      await db
        .update(gaConnectionTable)
        .set({
          status: "error",
          lastError: errorMessage,
        })
        .where(eq(gaConnectionTable.organizationId, organizationId));

      throw new Error(`GA token refresh failed: ${errorMessage}`);
    }
  }

  return connection.accessToken;
}

/**
 * Get GA connection for an organization
 */
export async function getGAConnection(
  organizationId: string
): Promise<GAConnection | null> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    return null;
  }

  // Get associated properties
  const properties = await db.query.gaPropertyTable.findMany({
    where: eq(gaPropertyTable.gaConnectionId, connection.id),
  });

  return mapConnectionToType(connection, properties);
}

/**
 * Get the active GA4 property for an organization
 */
export async function getActiveProperty(
  organizationId: string
): Promise<GaPropertyRow | null> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    return null;
  }

  const property = await db.query.gaPropertyTable.findFirst({
    where: and(
      eq(gaPropertyTable.gaConnectionId, connection.id),
      eq(gaPropertyTable.isActive, true)
    ),
  });

  return property || null;
}

/**
 * Set the active property for an organization
 */
export async function setActiveProperty(
  organizationId: string,
  propertyId: string
): Promise<void> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GA not connected");
  }

  // Deactivate all properties first
  await db
    .update(gaPropertyTable)
    .set({ isActive: false })
    .where(eq(gaPropertyTable.gaConnectionId, connection.id));

  // Activate the selected property
  await db
    .update(gaPropertyTable)
    .set({ isActive: true })
    .where(
      and(
        eq(gaPropertyTable.gaConnectionId, connection.id),
        eq(gaPropertyTable.propertyId, propertyId)
      )
    );
}

/**
 * Add a new property to the connection
 */
export async function addProperty(
  organizationId: string,
  propertyId: string,
  propertyName: string,
  makeActive: boolean = false
): Promise<GaPropertyRow> {
  const connection = await db.query.gaConnectionTable.findFirst({
    where: eq(gaConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("GA not connected");
  }

  // If making active, deactivate all others first
  if (makeActive) {
    await db
      .update(gaPropertyTable)
      .set({ isActive: false })
      .where(eq(gaPropertyTable.gaConnectionId, connection.id));
  }

  // Fetch property details
  const accessToken = await getValidAccessToken(organizationId);
  const propertyData = await fetchGA4Property(accessToken, propertyId);

  const result = await db
    .insert(gaPropertyTable)
    .values({
      gaConnectionId: connection.id,
      organizationId,
      propertyId,
      propertyName,
      isActive: makeActive,
      propertyData,
      status: "active",
      lastSyncedAt: new Date(),
    })
    .returning();

  const property = result[0];
  if (!property) {
    throw new Error("Failed to add property");
  }

  return property;
}

/**
 * Disconnect GA from an organization
 */
export async function disconnectGA(organizationId: string): Promise<void> {
  await db
    .delete(gaConnectionTable)
    .where(eq(gaConnectionTable.organizationId, organizationId));
}

// ============================================================================
// Analytics Data
// ============================================================================

/**
 * Get traffic metrics for the active property
 */
export async function getTrafficMetrics(
  organizationId: string,
  days: number = 30
): Promise<GA4TrafficData> {
  const accessToken = await getValidAccessToken(organizationId);
  const property = await getActiveProperty(organizationId);

  if (!property) {
    throw new Error("No active GA4 property. Please select a property.");
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Format dates as YYYY-MM-DD
  const formatDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return fetchGA4TrafficMetrics(
    accessToken,
    property.propertyId,
    formatDate(startDate),
    formatDate(endDate)
  );
}

/**
 * Get top pages for the active property
 */
export async function getTopPages(
  organizationId: string,
  days: number = 30,
  limit: number = 10
): Promise<
  Array<{ pagePath: string; pageviews: number; avgTimeOnPage: number }>
> {
  const accessToken = await getValidAccessToken(organizationId);
  const property = await getActiveProperty(organizationId);

  if (!property) {
    throw new Error("No active GA4 property. Please select a property.");
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return fetchGA4TopPages(
    accessToken,
    property.propertyId,
    formatDate(startDate),
    formatDate(endDate),
    limit
  );
}

/**
 * Get traffic sources for the active property
 */
export async function getTrafficSources(
  organizationId: string,
  days: number = 30,
  limit: number = 10
): Promise<
  Array<{ source: string; medium: string; sessions: number; users: number }>
> {
  const accessToken = await getValidAccessToken(organizationId);
  const property = await getActiveProperty(organizationId);

  if (!property) {
    throw new Error("No active GA4 property. Please select a property.");
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return fetchGA4TrafficSources(
    accessToken,
    property.propertyId,
    formatDate(startDate),
    formatDate(endDate),
    limit
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map database row to GAConnection type
 */
function mapConnectionToType(
  row: GaConnectionRow,
  properties?: GaPropertyRow[]
): GAConnection {
  return {
    id: row.id,
    organizationId: row.organizationId,
    googleAccountId: row.googleAccountId,
    googleEmail: row.googleEmail,
    status: row.status as GAConnection["status"],
    lastError: row.lastError,
    lastValidatedAt: row.lastValidatedAt,
    connectedByUserId: row.connectedByUserId,
    createdAt: row.createdAt,
    properties: properties?.map((p) => ({
      id: p.id,
      propertyId: p.propertyId,
      propertyName: p.propertyName,
      isActive: p.isActive,
      status: p.status,
    })),
  };
}
