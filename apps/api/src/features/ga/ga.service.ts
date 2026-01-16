/**
 * Google Analytics Service
 *
 * Business logic for GA4 operations including connection management
 * and analytics data fetching.
 *
 * Uses the shared Google connection for OAuth tokens.
 */

import { db, eq, and, googleConnectionTable, gaPropertyTable } from "@repo/db";
import type { GaPropertyRow, GoogleConnectionRow } from "@repo/db";

import {
  getValidAccessTokenForService,
  getPendingGoogleConnection,
  activateConnection,
  getGoogleConnectionRow,
} from "../google/google.service";

/**
 * Get a connection for GA setup - works with both pending and active connections.
 * This allows users to change properties when they already have an active Google connection.
 */
async function getConnectionForGASetup(
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

import {
  fetchGA4Properties,
  fetchGA4Property,
  fetchGA4TrafficMetrics,
  fetchGA4TopPages,
  fetchGA4TrafficSources,
} from "./ga-api.utils";
import type { GA4Property, GA4TrafficData } from "./ga-api.utils";

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
// Pending Connection Management (Secure OAuth Flow)
// ============================================================================

/**
 * List available GA4 properties for a connection
 * Works with both pending and active connections.
 */
export async function listPropertiesForPendingConnection(
  connectionId: string,
  userId: string
): Promise<GA4Property[]> {
  const connection = await getConnectionForGASetup(connectionId, userId);
  if (!connection) {
    throw new Error("Connection not found or expired");
  }

  return fetchGA4Properties(connection.accessToken);
}

/**
 * Complete GA connection setup by selecting a GA4 property
 * Works with both pending and active connections.
 */
export async function completePendingGAConnection(input: {
  connectionId: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  propertyData?: GA4Property;
}): Promise<GAConnection> {
  // Get the connection (works with both pending and active)
  const existingConnection = await getConnectionForGASetup(
    input.connectionId,
    input.userId
  );
  if (!existingConnection) {
    throw new Error("Connection not found or expired");
  }

  let connection: GoogleConnectionRow;

  if (existingConnection.status === "pending") {
    // Activate the pending connection and enable GA service
    connection = await activateConnection(input.connectionId, "ga");
  } else {
    // For active connections, just enable GA service
    const currentServices = existingConnection.enabledServices || [];
    const updatedServices = currentServices.includes("ga")
      ? currentServices
      : ([...currentServices, "ga"] as typeof currentServices);

    const result = await db
      .update(googleConnectionTable)
      .set({ enabledServices: updatedServices })
      .where(eq(googleConnectionTable.id, input.connectionId))
      .returning();

    connection = result[0]!;
  }

  // Delete any existing properties for this organization
  await db
    .delete(gaPropertyTable)
    .where(eq(gaPropertyTable.organizationId, connection.organizationId));

  // Create the selected property as active
  await db.insert(gaPropertyTable).values({
    googleConnectionId: connection.id,
    organizationId: connection.organizationId,
    propertyId: input.propertyId,
    propertyName: input.propertyName,
    isActive: true,
    propertyData: input.propertyData || null,
    status: "active",
    lastSyncedAt: new Date(),
  });

  return mapConnectionToGAType(connection);
}

// ============================================================================
// Connection Status
// ============================================================================

/**
 * Get GA connection status for an organization
 */
export async function getGAConnection(
  organizationId: string
): Promise<GAConnection | null> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    return null;
  }

  // Check if GA is enabled
  if (!connection.enabledServices.includes("ga")) {
    return null;
  }

  // Get associated properties
  const properties = await db.query.gaPropertyTable.findMany({
    where: eq(gaPropertyTable.googleConnectionId, connection.id),
  });

  return mapConnectionToGAType(connection, properties);
}

/**
 * Get the active GA4 property for an organization
 */
export async function getActiveProperty(
  organizationId: string
): Promise<GaPropertyRow | null> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection || !connection.enabledServices.includes("ga")) {
    return null;
  }

  const property = await db.query.gaPropertyTable.findFirst({
    where: and(
      eq(gaPropertyTable.googleConnectionId, connection.id),
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
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    throw new Error("Google not connected");
  }

  // Deactivate all properties first
  await db
    .update(gaPropertyTable)
    .set({ isActive: false })
    .where(eq(gaPropertyTable.googleConnectionId, connection.id));

  // Activate the selected property
  await db
    .update(gaPropertyTable)
    .set({ isActive: true })
    .where(
      and(
        eq(gaPropertyTable.googleConnectionId, connection.id),
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
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    throw new Error("Google not connected");
  }

  // If making active, deactivate all others first
  if (makeActive) {
    await db
      .update(gaPropertyTable)
      .set({ isActive: false })
      .where(eq(gaPropertyTable.googleConnectionId, connection.id));
  }

  // Fetch property details
  const accessToken = await getValidAccessTokenForService(organizationId, "ga");
  const propertyData = await fetchGA4Property(accessToken, propertyId);

  const result = await db
    .insert(gaPropertyTable)
    .values({
      googleConnectionId: connection.id,
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
 * Disconnect GA from an organization (disables service, removes properties)
 */
export async function disconnectGA(organizationId: string): Promise<void> {
  const connection = await getGoogleConnectionRow(organizationId);

  if (!connection) {
    return;
  }

  // Delete all GA properties for this connection
  await db
    .delete(gaPropertyTable)
    .where(eq(gaPropertyTable.googleConnectionId, connection.id));

  // Disable GA service on the connection
  const updatedServices = connection.enabledServices.filter((s) => s !== "ga");

  await db
    .update(googleConnectionTable)
    .set({ enabledServices: updatedServices })
    .where(eq(googleConnectionTable.organizationId, organizationId));
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
  const accessToken = await getValidAccessTokenForService(organizationId, "ga");
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
  const accessToken = await getValidAccessTokenForService(organizationId, "ga");
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
  const accessToken = await getValidAccessTokenForService(organizationId, "ga");
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
function mapConnectionToGAType(
  row: GoogleConnectionRow,
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
