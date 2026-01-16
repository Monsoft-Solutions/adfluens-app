import { z } from "zod";
import {
  router,
  organizationProcedure,
  protectedProcedure,
} from "../../trpc/init";
import { TRPCError } from "@trpc/server";
import {
  getGMBOAuthUrl,
  getGMBConnection,
  disconnectGMB,
  listGMBAccounts,
  listGMBLocations,
  getLocationInfo,
  refreshLocationData,
  listReviews,
  replyToReview,
  deleteReply,
  listPosts,
  createPost,
  deletePost,
  getPerformanceMetrics,
  generateReplySuggestion,
  analyzeReviewSentiment,
  listMedia,
  uploadMedia,
  deleteMediaItem,
  getPendingGMBConnection,
  completePendingGMBConnection,
} from "./gmb.service";
import { syncFromGmbConnections } from "../platform-connection/platform-connection.service";

/**
 * Schema for pagination options
 */
const paginationSchema = z.object({
  pageSize: z.number().min(1).max(50).optional(),
  pageToken: z.string().optional(),
});

/**
 * Schema for selecting account and location after OAuth
 * Uses setupCode to retrieve tokens securely from the server
 */
const selectLocationSchema = z.object({
  setupCode: z.string().uuid(),
  gmbAccountId: z.string(),
  gmbLocationId: z.string(),
  gmbLocationName: z.string().optional(),
});

/**
 * Schema for replying to a review
 */
const replyToReviewSchema = z.object({
  reviewId: z.string(),
  comment: z.string().min(1).max(4096),
});

/**
 * Schema for creating a post
 */
const createPostSchema = z.object({
  summary: z.string().min(1).max(1500),
  topicType: z.enum(["STANDARD", "EVENT", "OFFER", "PRODUCT"]).optional(),
  callToAction: z
    .object({
      actionType: z.enum([
        "BOOK",
        "ORDER",
        "SHOP",
        "LEARN_MORE",
        "SIGN_UP",
        "GET_OFFER",
        "CALL",
      ]),
      url: z.string().url().optional(),
    })
    .optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  languageCode: z.string().optional(),
});

export const gmbRouter = router({
  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Get the current organization's GMB connection status
   */
  getConnection: organizationProcedure.query(async ({ ctx }) => {
    const connection = await getGMBConnection(ctx.organization.id);
    return { connection };
  }),

  /**
   * Get the OAuth URL to start GMB connection flow
   */
  getOAuthUrl: organizationProcedure
    .input(z.object({ redirectPath: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const url = getGMBOAuthUrl(
        ctx.organization.id,
        ctx.user.id,
        input?.redirectPath
      );
      return { url };
    }),

  /**
   * List GMB accounts for a user (using pending connection ID)
   * Called after OAuth callback with the setup code (connection ID)
   */
  listAccounts: protectedProcedure
    .input(z.object({ setupCode: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const connection = await getPendingGMBConnection(
        input.setupCode,
        ctx.user.id
      );
      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pending connection not found",
        });
      }
      const accounts = await listGMBAccounts(connection.accessToken);
      return { accounts };
    }),

  /**
   * List locations for a GMB account (using pending connection ID)
   */
  listLocations: protectedProcedure
    .input(z.object({ setupCode: z.string().uuid(), accountName: z.string() }))
    .query(async ({ ctx, input }) => {
      const connection = await getPendingGMBConnection(
        input.setupCode,
        ctx.user.id
      );
      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pending connection not found",
        });
      }
      const locations = await listGMBLocations(
        connection.accessToken,
        input.accountName
      );
      return { locations };
    }),

  /**
   * Complete the pending connection by setting account/location details
   */
  selectLocation: organizationProcedure
    .input(selectLocationSchema)
    .mutation(async ({ ctx, input }) => {
      const connection = await completePendingGMBConnection({
        connectionId: input.setupCode,
        userId: ctx.user.id,
        gmbAccountId: input.gmbAccountId,
        gmbLocationId: input.gmbLocationId,
        gmbLocationName: input.gmbLocationName,
      });

      // Sync platform connections for content creation
      await syncFromGmbConnections(ctx.organization.id);

      return { connection };
    }),

  /**
   * Disconnect GMB from the organization
   */
  disconnect: organizationProcedure.mutation(async ({ ctx }) => {
    await disconnectGMB(ctx.organization.id);
    return { success: true };
  }),

  // ============================================================================
  // Location Info
  // ============================================================================

  /**
   * Get location info (from cache or API)
   */
  getLocationInfo: organizationProcedure.query(async ({ ctx }) => {
    const locationData = await getLocationInfo(ctx.organization.id);
    return { locationData };
  }),

  /**
   * Force refresh location info from GMB API
   */
  refreshLocationInfo: organizationProcedure.mutation(async ({ ctx }) => {
    const locationData = await refreshLocationData(ctx.organization.id);
    return { locationData };
  }),

  // ============================================================================
  // Reviews
  // ============================================================================

  /**
   * List reviews for the connected location
   */
  listReviews: organizationProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const response = await listReviews(ctx.organization.id, input);
      return response;
    }),

  /**
   * Reply to a review
   */
  replyToReview: organizationProcedure
    .input(replyToReviewSchema)
    .mutation(async ({ ctx, input }) => {
      await replyToReview(ctx.organization.id, input.reviewId, input.comment);
      return { success: true };
    }),

  /**
   * Delete a review reply
   */
  deleteReviewReply: organizationProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deleteReply(ctx.organization.id, input.reviewId);
      return { success: true };
    }),

  // ============================================================================
  // Posts
  // ============================================================================

  /**
   * List posts for the connected location
   */
  listPosts: organizationProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const response = await listPosts(ctx.organization.id, input);
      return response;
    }),

  /**
   * Create a new post
   */
  createPost: organizationProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await createPost(ctx.organization.id, input);
      return { post };
    }),

  /**
   * Delete a post
   */
  deletePost: organizationProcedure
    .input(z.object({ postName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deletePost(ctx.organization.id, input.postName);
      return { success: true };
    }),

  // ============================================================================
  // Performance Analytics
  // ============================================================================

  /**
   * Get performance metrics for the connected location
   */
  getPerformanceMetrics: organizationProcedure
    .input(
      z
        .object({
          days: z.number().min(7).max(90).default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const data = await getPerformanceMetrics(
        ctx.organization.id,
        input?.days ?? 30
      );
      return data;
    }),

  // ============================================================================
  // AI Review Responses
  // ============================================================================

  /**
   * Generate an AI-suggested reply for a review
   */
  generateReplySuggestion: organizationProcedure
    .input(
      z.object({
        reviewId: z.string(),
        tone: z.enum(["professional", "friendly", "empathetic"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const suggestion = await generateReplySuggestion(
        ctx.organization.id,
        input.reviewId,
        input.tone
      );
      return { suggestion };
    }),

  /**
   * Analyze a review for sentiment and get a suggested reply
   */
  analyzeReview: organizationProcedure
    .input(z.object({ reviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const analysis = await analyzeReviewSentiment(
        ctx.organization.id,
        input.reviewId
      );
      return analysis;
    }),

  // ============================================================================
  // Media Management
  // ============================================================================

  /**
   * List media items for the connected location
   */
  listMedia: organizationProcedure
    .input(z.object({ pageToken: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return listMedia(ctx.organization.id, input?.pageToken);
    }),

  /**
   * Upload media from a URL
   */
  uploadMedia: organizationProcedure
    .input(
      z.object({
        sourceUrl: z.string().url(),
        category: z.enum([
          "COVER",
          "PROFILE",
          "INTERIOR",
          "EXTERIOR",
          "FOOD_AND_DRINK",
          "MENU",
          "PRODUCT",
          "TEAM",
          "ADDITIONAL",
        ]),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await uploadMedia(
        ctx.organization.id,
        input.sourceUrl,
        input.category,
        input.description
      );
      return { media };
    }),

  /**
   * Delete a media item
   */
  deleteMedia: organizationProcedure
    .input(z.object({ mediaName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMediaItem(ctx.organization.id, input.mediaName);
      return { success: true };
    }),
});
