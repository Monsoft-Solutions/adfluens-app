import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import {
  getConnectionStatus,
  getOverviewMetrics,
} from "./analytics-dashboard.service";

/**
 * Schema for date range input
 */
const dateRangeSchema = z.object({
  days: z.number().min(7).max(90).default(30),
});

export const analyticsDashboardRouter = router({
  /**
   * Get connection status for all platforms
   */
  getConnectionStatus: organizationProcedure.query(async ({ ctx }) => {
    const status = await getConnectionStatus(ctx.organization.id);
    return status;
  }),

  /**
   * Get aggregated overview metrics from all platforms
   */
  getOverview: organizationProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ ctx, input }) => {
      const overview = await getOverviewMetrics(
        ctx.organization.id,
        input?.days ?? 30
      );
      return overview;
    }),
});
