import { z } from "zod";
import {
  router,
  organizationProcedure,
  protectedProcedure,
} from "../../trpc/init";
import {
  getGMBOAuthUrl,
  getGMBConnection,
  createGMBConnection,
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
} from "./gmb.service";

/**
 * Schema for pagination options
 */
const paginationSchema = z.object({
  pageSize: z.number().min(1).max(50).optional(),
  pageToken: z.string().optional(),
});

/**
 * Schema for selecting account and location after OAuth
 */
const selectLocationSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  accessTokenExpiresAt: z.string().datetime().optional(),
  scope: z.string().optional(),
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
      const url = getGMBOAuthUrl(ctx.organization.id, input?.redirectPath);
      return { url };
    }),

  /**
   * List GMB accounts for a user (using temporary access token from OAuth)
   * Called after OAuth callback with the tokens
   */
  listAccounts: protectedProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      const accounts = await listGMBAccounts(input.accessToken);
      return { accounts };
    }),

  /**
   * List locations for a GMB account (using temporary access token)
   */
  listLocations: protectedProcedure
    .input(z.object({ accessToken: z.string(), accountName: z.string() }))
    .query(async ({ input }) => {
      const locations = await listGMBLocations(
        input.accessToken,
        input.accountName
      );
      return { locations };
    }),

  /**
   * Save selected account and location after OAuth flow
   */
  selectLocation: organizationProcedure
    .input(selectLocationSchema)
    .mutation(async ({ ctx, input }) => {
      const connection = await createGMBConnection({
        organizationId: ctx.organization.id,
        connectedByUserId: ctx.user.id,
        gmbAccountId: input.gmbAccountId,
        gmbLocationId: input.gmbLocationId,
        gmbLocationName: input.gmbLocationName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        accessTokenExpiresAt: input.accessTokenExpiresAt
          ? new Date(input.accessTokenExpiresAt)
          : undefined,
        scope: input.scope,
      });

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
});
