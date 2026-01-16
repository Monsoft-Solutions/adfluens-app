import { z } from "zod";
import {
  router,
  organizationProcedure,
  protectedProcedure,
} from "../../trpc/init";
import { TRPCError } from "@trpc/server";
import {
  getGAConnection,
  disconnectGA,
  listPropertiesForPendingConnection,
  completePendingGAConnection,
  getActiveProperty,
  setActiveProperty,
  getTrafficMetrics,
  getTopPages,
  getTrafficSources,
} from "./ga.service";

/**
 * Schema for selecting a property after OAuth
 */
const selectPropertySchema = z.object({
  setupCode: z.string().uuid(),
  propertyId: z.string(),
  propertyName: z.string(),
});

/**
 * Schema for date range input
 */
const dateRangeSchema = z.object({
  days: z.number().min(7).max(90).default(30),
});

export const gaRouter = router({
  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Get the current organization's GA connection status
   */
  getConnection: organizationProcedure.query(async ({ ctx }) => {
    const connection = await getGAConnection(ctx.organization.id);
    return { connection };
  }),

  /**
   * List available GA4 properties (using pending connection ID)
   * Called after OAuth callback with the setup code (connection ID)
   */
  listProperties: protectedProcedure
    .input(z.object({ setupCode: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const properties = await listPropertiesForPendingConnection(
          input.setupCode,
          ctx.user.id
        );
        return { properties };
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            error instanceof Error
              ? error.message
              : "Pending connection not found",
        });
      }
    }),

  /**
   * Complete the pending connection by selecting a GA4 property
   */
  selectProperty: organizationProcedure
    .input(selectPropertySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const connection = await completePendingGAConnection({
          connectionId: input.setupCode,
          userId: ctx.user.id,
          propertyId: input.propertyId,
          propertyName: input.propertyName,
        });

        return { connection };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to complete connection",
        });
      }
    }),

  /**
   * Get the active GA4 property for the organization
   */
  getActiveProperty: organizationProcedure.query(async ({ ctx }) => {
    const property = await getActiveProperty(ctx.organization.id);
    return { property };
  }),

  /**
   * Set the active GA4 property for the organization
   */
  setActiveProperty: organizationProcedure
    .input(z.object({ propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await setActiveProperty(ctx.organization.id, input.propertyId);
      return { success: true };
    }),

  /**
   * Disconnect GA from the organization
   */
  disconnect: organizationProcedure.mutation(async ({ ctx }) => {
    await disconnectGA(ctx.organization.id);
    return { success: true };
  }),

  // ============================================================================
  // Analytics Data
  // ============================================================================

  /**
   * Get traffic metrics for the active property
   */
  getTrafficMetrics: organizationProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      try {
        const data = await getTrafficMetrics(
          ctx.organization.id,
          input?.days ?? 30
        );
        return data;
      } catch (error) {
        // If no property is selected, return null instead of throwing
        if (
          error instanceof Error &&
          error.message.includes("No active GA4 property")
        ) {
          return null;
        }
        throw error;
      }
    }),

  /**
   * Get top pages for the active property
   */
  getTopPages: organizationProcedure
    .input(
      z
        .object({
          days: z.number().min(7).max(90).default(30),
          limit: z.number().min(1).max(50).default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const pages = await getTopPages(
          ctx.organization.id,
          input?.days ?? 30,
          input?.limit ?? 10
        );
        return { pages };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("No active GA4 property")
        ) {
          return { pages: [] };
        }
        throw error;
      }
    }),

  /**
   * Get traffic sources for the active property
   */
  getTrafficSources: organizationProcedure
    .input(
      z
        .object({
          days: z.number().min(7).max(90).default(30),
          limit: z.number().min(1).max(50).default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const sources = await getTrafficSources(
          ctx.organization.id,
          input?.days ?? 30,
          input?.limit ?? 10
        );
        return { sources };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("No active GA4 property")
        ) {
          return { sources: [] };
        }
        throw error;
      }
    }),
});
