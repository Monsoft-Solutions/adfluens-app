/**
 * Platform Connection Router
 *
 * tRPC endpoints for managing unified platform connections.
 * Provides access to connected accounts across all platforms (Meta, GMB, LinkedIn, Twitter).
 */

import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import * as platformConnectionService from "./platform-connection.service";

// =============================================================================
// Platform Schema (matching database enum)
// =============================================================================

const platformSchema = z.enum([
  "facebook",
  "instagram",
  "gmb",
  "linkedin",
  "twitter",
]);

const connectionStatusSchema = z.enum(["active", "disconnected", "error"]);

// =============================================================================
// Router Definition
// =============================================================================

export const platformConnectionRouter = router({
  // ===========================================================================
  // List & Get Operations
  // ===========================================================================

  /**
   * List all platform connections for the organization
   */
  list: organizationProcedure
    .input(
      z
        .object({
          platforms: z.array(platformSchema).optional(),
          status: connectionStatusSchema.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return platformConnectionService.listConnections(ctx.organization.id, {
        platforms: input?.platforms,
        status: input?.status,
      });
    }),

  /**
   * Get connections by IDs
   */
  getByIds: organizationProcedure
    .input(
      z.object({
        connectionIds: z.array(z.string().uuid()),
      })
    )
    .query(async ({ ctx, input }) => {
      return platformConnectionService.getConnectionsByIds(
        input.connectionIds,
        ctx.organization.id
      );
    }),

  /**
   * Get a single connection by ID
   */
  get: organizationProcedure
    .input(
      z.object({
        connectionId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return platformConnectionService.getConnectionOrThrow(
        input.connectionId,
        ctx.organization.id
      );
    }),

  // ===========================================================================
  // Sync Operations
  // ===========================================================================

  /**
   * Sync platform connections from all OAuth sources
   *
   * Creates or updates platform connections from Meta pages, GMB connections, etc.
   * Should be called after OAuth or when connections need refreshing.
   */
  syncAll: organizationProcedure.mutation(async ({ ctx }) => {
    return platformConnectionService.syncAllConnections(ctx.organization.id);
  }),

  /**
   * Sync platform connections from Meta pages only
   */
  syncFromMeta: organizationProcedure.mutation(async ({ ctx }) => {
    return platformConnectionService.syncFromMetaPages(ctx.organization.id);
  }),

  /**
   * Sync platform connections from GMB only
   */
  syncFromGmb: organizationProcedure.mutation(async ({ ctx }) => {
    return platformConnectionService.syncFromGmbConnections(
      ctx.organization.id
    );
  }),

  // ===========================================================================
  // Summary & Stats
  // ===========================================================================

  /**
   * Get a summary of connected platforms
   *
   * Returns counts and availability by platform.
   */
  getSummary: organizationProcedure.query(async ({ ctx }) => {
    return platformConnectionService.getConnectionsSummary(ctx.organization.id);
  }),
});
