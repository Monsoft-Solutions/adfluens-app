/**
 * Google Connection Service
 *
 * Unified business logic for managing Google OAuth connections across all services
 * (GA, GMB, GSC). Handles connection lifecycle, token management, and incremental
 * authorization for service-specific scopes.
 */

import { db, eq, googleConnectionTable } from "@repo/db";
import type { GoogleConnectionRow, GoogleServiceType } from "@repo/db";
import { env } from "@repo/env";

import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken as refreshAccessTokenApi,
  fetchUserInfo,
  getScopesForService,
  hasServiceScopesGranted,
  SERVICE_SCOPES,
} from "./google-api.utils";
import type { GoogleOAuthTokens } from "./google-api.utils";

// ============================================================================
// Types
// ============================================================================

export type GoogleConnection = {
  id: string;
  organizationId: string;
  googleAccountId: string;
  googleEmail?: string | null;
  googleName?: string | null;
  googlePicture?: string | null;
  enabledServices: GoogleServiceType[];
  grantedScopes?: string | null;
  status: "active" | "pending" | "disconnected" | "error";
  lastError?: string | null;
  lastValidatedAt?: Date | null;
  connectedByUserId: string;
  createdAt: Date;
};

export type ServiceStatus = {
  service: GoogleServiceType;
  enabled: boolean;
  scopeGranted: boolean;
};

// ============================================================================
// Constants
// ============================================================================

/** Buffer time before token expiration to trigger refresh (5 minutes) */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Default redirect path for OAuth */
const DEFAULT_REDIRECT_PATH = "/settings";

// ============================================================================
// OAuth & Connection Management
// ============================================================================

/**
 * Generate the OAuth URL for connecting Google services
 *
 * @param organizationId - Organization ID
 * @param userId - User ID
 * @param service - Service to enable ('ga' | 'gmb' | 'gsc')
 * @param redirectPath - Path to redirect to after OAuth
 */
export function getGoogleOAuthUrl(
  organizationId: string,
  userId: string,
  service: GoogleServiceType,
  redirectPath: string = DEFAULT_REDIRECT_PATH
): string {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/google/callback`;

  // Encode state with organization ID, user ID, service, and redirect path
  const state = Buffer.from(
    JSON.stringify({ organizationId, userId, service, redirectPath })
  ).toString("base64");

  // Get scopes for the requested service
  const scopes = getScopesForService(service);

  return getGoogleAuthUrl(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
    state,
    scopes
  );
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(
  code: string
): Promise<GoogleOAuthTokens> {
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/google/callback`;

  return exchangeCodeForTokens(
    code,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Parse OAuth state from callback
 */
export function parseOAuthState(state: string): {
  organizationId: string;
  userId: string;
  service: GoogleServiceType;
  redirectPath: string;
} {
  const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
  return {
    organizationId: stateData.organizationId,
    userId: stateData.userId,
    service: stateData.service || "ga",
    redirectPath: stateData.redirectPath || DEFAULT_REDIRECT_PATH,
  };
}

// ============================================================================
// Connection CRUD
// ============================================================================

/**
 * Create a pending Google connection to store OAuth tokens securely.
 * This prevents tokens from being exposed in URL parameters.
 * The connection remains "pending" until the user completes service setup.
 */
export async function createPendingGoogleConnection(input: {
  organizationId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  scope?: string;
  service: GoogleServiceType;
}): Promise<GoogleConnectionRow> {
  // First, get user info from Google
  const userInfo = await fetchUserInfo(input.accessToken);

  // Delete any existing connection for this organization (will be replaced)
  await db
    .delete(googleConnectionTable)
    .where(eq(googleConnectionTable.organizationId, input.organizationId));

  const result = await db
    .insert(googleConnectionTable)
    .values({
      organizationId: input.organizationId,
      connectedByUserId: input.userId,
      googleAccountId: userInfo.id,
      googleEmail: userInfo.email,
      googleName: userInfo.name,
      googlePicture: userInfo.picture,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      grantedScopes: input.scope,
      enabledServices: [], // Services enabled after property/location selection
      status: "pending",
    })
    .returning();

  const connection = result[0];
  if (!connection) {
    throw new Error("Failed to create pending Google connection");
  }

  return connection;
}

/**
 * Get a pending connection by ID, validating it belongs to the user.
 */
export async function getPendingGoogleConnection(
  connectionId: string,
  userId: string
): Promise<GoogleConnectionRow | null> {
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.id, connectionId),
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
 * Activate a pending connection and enable a service
 */
export async function activateConnection(
  connectionId: string,
  service: GoogleServiceType
): Promise<GoogleConnectionRow> {
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.id, connectionId),
  });

  if (!connection) {
    throw new Error("Connection not found");
  }

  // Get current enabled services and add the new one
  const currentServices = connection.enabledServices || [];
  const updatedServices = currentServices.includes(service)
    ? currentServices
    : [...currentServices, service];

  const result = await db
    .update(googleConnectionTable)
    .set({
      status: "active",
      enabledServices: updatedServices,
      lastValidatedAt: new Date(),
    })
    .where(eq(googleConnectionTable.id, connectionId))
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error("Failed to activate connection");
  }

  return updated;
}

/**
 * Get Google connection for an organization
 */
export async function getGoogleConnection(
  organizationId: string
): Promise<GoogleConnection | null> {
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    return null;
  }

  return mapConnectionToType(connection);
}

/**
 * Get Google connection row for an organization (internal use)
 */
export async function getGoogleConnectionRow(
  organizationId: string
): Promise<GoogleConnectionRow | null> {
  const result = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.organizationId, organizationId),
  });
  return result ?? null;
}

/**
 * Check if a service is enabled for an organization
 */
export async function isServiceEnabled(
  organizationId: string,
  service: GoogleServiceType
): Promise<boolean> {
  const connection = await getGoogleConnectionRow(organizationId);
  if (!connection) return false;
  if (connection.status !== "active") return false;

  return connection.enabledServices.includes(service);
}

/**
 * Enable a service for an existing connection
 * Returns the OAuth URL if incremental authorization is needed
 */
export async function enableService(
  organizationId: string,
  userId: string,
  service: GoogleServiceType,
  redirectPath: string = DEFAULT_REDIRECT_PATH
): Promise<{ needsAuth: boolean; authUrl?: string }> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    // No connection - start fresh OAuth flow
    const authUrl = getGoogleOAuthUrl(
      organizationId,
      userId,
      service,
      redirectPath
    );
    return { needsAuth: true, authUrl };
  }

  // Check if scope is already granted
  const scopeGranted = hasServiceScopesGranted(
    connection.grantedScopes,
    service
  );

  if (!scopeGranted) {
    // Need incremental authorization
    const authUrl = getGoogleOAuthUrl(
      organizationId,
      userId,
      service,
      redirectPath
    );
    return { needsAuth: true, authUrl };
  }

  // Scope already granted, just enable the service
  const updatedServices = connection.enabledServices.includes(service)
    ? connection.enabledServices
    : [...connection.enabledServices, service];

  await db
    .update(googleConnectionTable)
    .set({ enabledServices: updatedServices })
    .where(eq(googleConnectionTable.organizationId, organizationId));

  return { needsAuth: false };
}

/**
 * Disable a service for an existing connection
 */
export async function disableService(
  organizationId: string,
  service: GoogleServiceType
): Promise<void> {
  const connection = await getGoogleConnectionRow(organizationId);
  if (!connection) return;

  const updatedServices = connection.enabledServices.filter(
    (s) => s !== service
  );

  await db
    .update(googleConnectionTable)
    .set({ enabledServices: updatedServices })
    .where(eq(googleConnectionTable.organizationId, organizationId));
}

/**
 * Get service statuses for an organization
 */
export async function getServiceStatuses(
  organizationId: string
): Promise<ServiceStatus[]> {
  const connection = await getGoogleConnectionRow(organizationId);

  const services: GoogleServiceType[] = ["ga", "gmb", "gsc"];

  return services.map((service) => ({
    service,
    enabled: connection?.enabledServices.includes(service) ?? false,
    scopeGranted: hasServiceScopesGranted(connection?.grantedScopes, service),
  }));
}

/**
 * Disconnect Google from an organization (removes all services)
 */
export async function disconnectGoogle(organizationId: string): Promise<void> {
  await db
    .delete(googleConnectionTable)
    .where(eq(googleConnectionTable.organizationId, organizationId));
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Get a valid access token, refreshing if necessary
 * This is the main function used by GA and GMB services to get tokens.
 */
export async function getValidAccessToken(
  organizationId: string
): Promise<string> {
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error("Google not connected for this organization");
  }

  if (connection.status !== "active") {
    throw new Error(
      `Google connection is ${connection.status}. Please reconnect.`
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
        .update(googleConnectionTable)
        .set({
          status: "error",
          lastError: "Refresh token not available. Please reconnect.",
        })
        .where(eq(googleConnectionTable.organizationId, organizationId));

      throw new Error("Google access expired. Please reconnect.");
    }

    try {
      const newTokens = await refreshAccessTokenApi(
        connection.refreshToken,
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );

      // Update database with new tokens
      await db
        .update(googleConnectionTable)
        .set({
          accessToken: newTokens.accessToken,
          accessTokenExpiresAt: newTokens.expiresAt,
          lastError: null,
        })
        .where(eq(googleConnectionTable.organizationId, organizationId));

      return newTokens.accessToken;
    } catch (error) {
      // Mark connection as error
      const errorMessage =
        error instanceof Error ? error.message : "Token refresh failed";

      await db
        .update(googleConnectionTable)
        .set({
          status: "error",
          lastError: errorMessage,
        })
        .where(eq(googleConnectionTable.organizationId, organizationId));

      throw new Error(`Google token refresh failed: ${errorMessage}`);
    }
  }

  return connection.accessToken;
}

/**
 * Get a valid access token for a specific service
 * Validates that the service is enabled and has required scopes
 */
export async function getValidAccessTokenForService(
  organizationId: string,
  service: GoogleServiceType
): Promise<string> {
  const connection = await db.query.googleConnectionTable.findFirst({
    where: eq(googleConnectionTable.organizationId, organizationId),
  });

  if (!connection) {
    throw new Error(
      `Google not connected. Please connect to use ${service.toUpperCase()}.`
    );
  }

  if (!connection.enabledServices.includes(service)) {
    throw new Error(
      `${service.toUpperCase()} is not enabled. Please enable it in settings.`
    );
  }

  // Check if required scope is granted
  const requiredScope = SERVICE_SCOPES[service];
  if (
    requiredScope &&
    !hasServiceScopesGranted(connection.grantedScopes, service)
  ) {
    throw new Error(
      `Required ${service.toUpperCase()} permissions not granted. Please reconnect.`
    );
  }

  return getValidAccessToken(organizationId);
}

/**
 * Update connection with new tokens after incremental auth
 */
export async function updateConnectionTokens(
  organizationId: string,
  tokens: GoogleOAuthTokens,
  service: GoogleServiceType
): Promise<GoogleConnectionRow> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    throw new Error("Connection not found");
  }

  // Merge scopes if we got new ones
  let grantedScopes = connection.grantedScopes || "";
  if (tokens.scope) {
    const existingScopes = new Set(grantedScopes.split(" ").filter(Boolean));
    const newScopes = tokens.scope.split(" ").filter(Boolean);
    newScopes.forEach((s) => existingScopes.add(s));
    grantedScopes = Array.from(existingScopes).join(" ");
  }

  // Add service if not already enabled
  const enabledServices = connection.enabledServices.includes(service)
    ? connection.enabledServices
    : [...connection.enabledServices, service];

  const result = await db
    .update(googleConnectionTable)
    .set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || connection.refreshToken,
      accessTokenExpiresAt: tokens.expiresAt,
      grantedScopes,
      enabledServices,
      status: "active",
      lastError: null,
      lastValidatedAt: new Date(),
    })
    .where(eq(googleConnectionTable.organizationId, organizationId))
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error("Failed to update connection tokens");
  }

  return updated;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map database row to GoogleConnection type
 */
function mapConnectionToType(row: GoogleConnectionRow): GoogleConnection {
  return {
    id: row.id,
    organizationId: row.organizationId,
    googleAccountId: row.googleAccountId,
    googleEmail: row.googleEmail,
    googleName: row.googleName,
    googlePicture: row.googlePicture,
    enabledServices: row.enabledServices,
    grantedScopes: row.grantedScopes,
    status: row.status as GoogleConnection["status"],
    lastError: row.lastError,
    lastValidatedAt: row.lastValidatedAt,
    connectedByUserId: row.connectedByUserId,
    createdAt: row.createdAt,
  };
}
