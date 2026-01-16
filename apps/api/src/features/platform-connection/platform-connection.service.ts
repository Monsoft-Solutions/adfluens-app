/**
 * Platform Connection Service
 *
 * Business logic for managing unified platform connections.
 * Abstracts different OAuth sources (Meta, GMB, LinkedIn, Twitter) into a unified model.
 */

import {
  db,
  eq,
  and,
  inArray,
  platformConnectionTable,
  metaPageTable,
  gmbLocationTable,
  googleConnectionTable,
} from "@repo/db";
import type {
  PlatformConnectionRow,
  PlatformConnectionInsert,
  ContentPlatformDb,
} from "@repo/db";
import { TRPCError } from "@trpc/server";

// =============================================================================
// Types
// =============================================================================

type PlatformConnectionWithSource = PlatformConnectionRow & {
  /** Access token for publishing (resolved from source) */
  accessToken?: string;
  /** Additional credentials specific to the platform */
  credentials?: Record<string, unknown>;
};

type ListConnectionsOptions = {
  /** Filter by specific platforms */
  platforms?: ContentPlatformDb[];
  /** Filter by status */
  status?: "active" | "disconnected" | "error";
};

// =============================================================================
// List & Get Operations
// =============================================================================

/**
 * List all platform connections for an organization
 */
export async function listConnections(
  organizationId: string,
  options?: ListConnectionsOptions
): Promise<PlatformConnectionRow[]> {
  const conditions = [
    eq(platformConnectionTable.organizationId, organizationId),
  ];

  if (options?.status) {
    conditions.push(eq(platformConnectionTable.status, options.status));
  }

  if (options?.platforms && options.platforms.length > 0) {
    conditions.push(
      inArray(platformConnectionTable.platform, options.platforms)
    );
  }

  const connections = await db.query.platformConnectionTable.findMany({
    where: and(...conditions),
    orderBy: (table, { asc }) => [asc(table.platform), asc(table.accountName)],
  });

  return connections;
}

/**
 * Get connections by IDs
 */
export async function getConnectionsByIds(
  connectionIds: string[],
  organizationId: string
): Promise<PlatformConnectionRow[]> {
  if (connectionIds.length === 0) {
    return [];
  }

  const connections = await db.query.platformConnectionTable.findMany({
    where: and(
      inArray(platformConnectionTable.id, connectionIds),
      eq(platformConnectionTable.organizationId, organizationId)
    ),
  });

  return connections;
}

/**
 * Get a single connection by ID
 */
export async function getConnection(
  connectionId: string,
  organizationId: string
): Promise<PlatformConnectionRow | null> {
  const connection = await db.query.platformConnectionTable.findFirst({
    where: and(
      eq(platformConnectionTable.id, connectionId),
      eq(platformConnectionTable.organizationId, organizationId)
    ),
  });

  return connection ?? null;
}

/**
 * Get a connection or throw if not found
 */
export async function getConnectionOrThrow(
  connectionId: string,
  organizationId: string
): Promise<PlatformConnectionRow> {
  const connection = await getConnection(connectionId, organizationId);

  if (!connection) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Platform connection not found",
    });
  }

  return connection;
}

// =============================================================================
// Credential Resolution
// =============================================================================

/**
 * Resolve credentials for a platform connection
 *
 * Fetches the access token and additional credentials from the source table.
 */
export async function resolveCredentials(
  connection: PlatformConnectionRow
): Promise<PlatformConnectionWithSource> {
  const result: PlatformConnectionWithSource = { ...connection };

  switch (connection.sourceType) {
    case "meta_page": {
      const metaPage = await db.query.metaPageTable.findFirst({
        where: eq(metaPageTable.id, connection.sourceId),
      });

      if (!metaPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source Meta page not found",
        });
      }

      result.accessToken = metaPage.pageAccessToken;
      result.credentials = {
        pageId: metaPage.pageId,
        instagramAccountId: metaPage.instagramAccountId,
      };
      break;
    }

    case "gmb_connection": {
      // GMB now uses gmbLocationTable + googleConnectionTable
      const gmbLocation = await db.query.gmbLocationTable.findFirst({
        where: eq(gmbLocationTable.id, connection.sourceId),
      });

      if (!gmbLocation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source GMB location not found",
        });
      }

      // Get the access token from the Google connection
      const googleConnection = await db.query.googleConnectionTable.findFirst({
        where: eq(googleConnectionTable.id, gmbLocation.googleConnectionId),
      });

      if (!googleConnection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source Google connection not found",
        });
      }

      result.accessToken = googleConnection.accessToken;
      result.credentials = {
        accountId: gmbLocation.gmbAccountId,
        locationId: gmbLocation.gmbLocationId,
      };
      break;
    }

    case "linkedin_connection":
    case "twitter_connection":
      // Future: implement when these platforms are added
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: `${connection.sourceType} credentials resolution not yet implemented`,
      });

    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown source type: ${connection.sourceType}`,
      });
  }

  return result;
}

/**
 * Resolve credentials for multiple connections
 */
export async function resolveCredentialsForMany(
  connections: PlatformConnectionRow[]
): Promise<PlatformConnectionWithSource[]> {
  return Promise.all(connections.map(resolveCredentials));
}

// =============================================================================
// Summary & Stats
// =============================================================================

type PlatformAccount = {
  id: string;
  name: string;
};

type PlatformSummary = {
  facebook: { count: number; accounts: PlatformAccount[] };
  instagram: { count: number; accounts: PlatformAccount[] };
  gmb: { count: number; accounts: PlatformAccount[] };
  linkedin: { count: number; accounts: PlatformAccount[] };
  twitter: { count: number; accounts: PlatformAccount[] };
};

/**
 * Get a summary of connected platforms for an organization
 *
 * Returns counts and account lists by platform.
 */
export async function getConnectionsSummary(
  organizationId: string
): Promise<PlatformSummary> {
  const connections = await listConnections(organizationId, {
    status: "active",
  });

  const summary: PlatformSummary = {
    facebook: { count: 0, accounts: [] },
    instagram: { count: 0, accounts: [] },
    gmb: { count: 0, accounts: [] },
    linkedin: { count: 0, accounts: [] },
    twitter: { count: 0, accounts: [] },
  };

  for (const conn of connections) {
    const platform = conn.platform as keyof PlatformSummary;
    if (platform in summary) {
      summary[platform].count++;
      summary[platform].accounts.push({
        id: conn.id,
        name: conn.accountName,
      });
    }
  }

  return summary;
}

// =============================================================================
// Sync Operations
// =============================================================================

/**
 * Sync platform connections from Meta pages
 *
 * Creates or updates platform connections for all active Meta pages in an organization.
 * Should be called after Meta OAuth or page selection changes.
 */
export async function syncFromMetaPages(
  organizationId: string
): Promise<{ created: number; updated: number }> {
  // Get all active Meta pages for the organization
  const metaPages = await db.query.metaPageTable.findMany({
    where: and(
      eq(metaPageTable.organizationId, organizationId),
      eq(metaPageTable.status, "active")
    ),
  });

  let created = 0;
  let updated = 0;

  for (const page of metaPages) {
    // Sync Facebook connection
    const facebookResult = await upsertConnection({
      organizationId,
      platform: "facebook",
      platformAccountId: page.pageId,
      accountName: page.pageName,
      accountImageUrl: page.pageData?.profilePicture ?? null,
      sourceType: "meta_page",
      sourceId: page.id,
      status: "active",
    });
    if (facebookResult.created) created++;
    else updated++;

    // Sync Instagram connection if linked
    if (page.instagramAccountId) {
      const instagramResult = await upsertConnection({
        organizationId,
        platform: "instagram",
        platformAccountId: page.instagramAccountId,
        accountName: page.instagramUsername ?? page.pageName,
        accountUsername: page.instagramUsername,
        accountImageUrl: page.pageData?.profilePicture ?? null,
        sourceType: "meta_page",
        sourceId: page.id,
        status: "active",
      });
      if (instagramResult.created) created++;
      else updated++;
    }
  }

  return { created, updated };
}

/**
 * Sync platform connections from GMB
 *
 * Uses the new gmbLocationTable to sync GMB connections.
 */
export async function syncFromGmbConnections(
  organizationId: string
): Promise<{ created: number; updated: number }> {
  // Get active GMB locations for the organization
  const gmbLocations = await db.query.gmbLocationTable.findMany({
    where: and(
      eq(gmbLocationTable.organizationId, organizationId),
      eq(gmbLocationTable.isActive, true)
    ),
  });

  let created = 0;
  let updated = 0;

  for (const location of gmbLocations) {
    const result = await upsertConnection({
      organizationId,
      platform: "gmb",
      platformAccountId: location.gmbLocationId ?? location.gmbAccountId,
      accountName: location.locationName ?? "Google Business Profile",
      accountImageUrl: null,
      sourceType: "gmb_connection",
      sourceId: location.id,
      status: "active",
    });
    if (result.created) created++;
    else updated++;
  }

  return { created, updated };
}

/**
 * Sync all platform connections for an organization
 */
export async function syncAllConnections(
  organizationId: string
): Promise<{ created: number; updated: number }> {
  const metaResult = await syncFromMetaPages(organizationId);
  const gmbResult = await syncFromGmbConnections(organizationId);

  return {
    created: metaResult.created + gmbResult.created,
    updated: metaResult.updated + gmbResult.updated,
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Upsert a platform connection
 */
async function upsertConnection(
  data: Omit<PlatformConnectionInsert, "id" | "createdAt" | "updatedAt">
): Promise<{ created: boolean }> {
  // Check if connection already exists
  const existing = await db.query.platformConnectionTable.findFirst({
    where: and(
      eq(platformConnectionTable.organizationId, data.organizationId),
      eq(platformConnectionTable.platform, data.platform),
      eq(platformConnectionTable.platformAccountId, data.platformAccountId)
    ),
  });

  if (existing) {
    // Update existing connection
    await db
      .update(platformConnectionTable)
      .set({
        accountName: data.accountName,
        accountUsername: data.accountUsername,
        accountImageUrl: data.accountImageUrl,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        status: data.status,
        lastError: null,
      })
      .where(eq(platformConnectionTable.id, existing.id));

    return { created: false };
  }

  // Create new connection
  await db.insert(platformConnectionTable).values(data);

  return { created: true };
}

/**
 * Mark a connection as disconnected
 */
export async function markDisconnected(
  connectionId: string,
  error?: string
): Promise<void> {
  await db
    .update(platformConnectionTable)
    .set({
      status: "disconnected",
      lastError: error ?? null,
    })
    .where(eq(platformConnectionTable.id, connectionId));
}

/**
 * Mark connections by source as disconnected
 */
export async function markDisconnectedBySource(
  sourceType:
    | "meta_page"
    | "gmb_connection"
    | "linkedin_connection"
    | "twitter_connection",
  sourceId: string,
  error?: string
): Promise<void> {
  await db
    .update(platformConnectionTable)
    .set({
      status: "disconnected",
      lastError: error ?? null,
    })
    .where(
      and(
        eq(platformConnectionTable.sourceType, sourceType),
        eq(platformConnectionTable.sourceId, sourceId)
      )
    );
}
