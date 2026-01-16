import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import {
  getGoogleConnection,
  getGoogleOAuthUrl,
  enableService,
  disableService,
  getServiceStatuses,
  disconnectGoogle,
} from "./google.service";

/**
 * Schema for service enum
 */
const serviceSchema = z.enum(["ga", "gmb", "gsc"]);

export const googleRouter = router({
  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Get the current organization's Google connection status
   */
  getConnection: organizationProcedure.query(async ({ ctx }) => {
    const connection = await getGoogleConnection(ctx.organization.id);
    return { connection };
  }),

  /**
   * Get service statuses (enabled/scopeGranted) for the organization
   */
  getServiceStatuses: organizationProcedure.query(async ({ ctx }) => {
    const statuses = await getServiceStatuses(ctx.organization.id);
    return { statuses };
  }),

  /**
   * Get the OAuth URL to connect a Google service
   * This handles both new connections and incremental authorization
   */
  getOAuthUrl: organizationProcedure
    .input(
      z.object({
        service: serviceSchema,
        redirectPath: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const url = getGoogleOAuthUrl(
        ctx.organization.id,
        ctx.user.id,
        input.service,
        input.redirectPath
      );
      return { url };
    }),

  /**
   * Enable a service for the Google connection
   * Returns authUrl if incremental authorization is needed
   */
  enableService: organizationProcedure
    .input(
      z.object({
        service: serviceSchema,
        redirectPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await enableService(
        ctx.organization.id,
        ctx.user.id,
        input.service,
        input.redirectPath
      );
      return result;
    }),

  /**
   * Disable a service for the Google connection
   */
  disableService: organizationProcedure
    .input(z.object({ service: serviceSchema }))
    .mutation(async ({ ctx, input }) => {
      await disableService(ctx.organization.id, input.service);
      return { success: true };
    }),

  /**
   * Disconnect Google from the organization (removes all services)
   */
  disconnect: organizationProcedure.mutation(async ({ ctx }) => {
    await disconnectGoogle(ctx.organization.id);
    return { success: true };
  }),
});
