/**
 * Social Media Router
 *
 * tRPC endpoints for social media account operations.
 *
 * @module api/features/social-media/social-media.router
 */

import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import {
  getSocialMediaAccount,
  refreshSocialMediaAccount,
  getInstagramPostsForOrganization,
} from "./social-media.service";
import { SocialMediaPlatform } from "@repo/types/social-media/social-media-platform.enum";

/**
 * Schema for platform selection
 */
const platformSchema = z.enum([
  SocialMediaPlatform.INSTAGRAM,
  SocialMediaPlatform.FACEBOOK,
  SocialMediaPlatform.TIKTOK,
  SocialMediaPlatform.TWITTER,
  SocialMediaPlatform.LINKEDIN,
  SocialMediaPlatform.YOUTUBE,
]);

export const socialMediaRouter = router({
  /**
   * Get a social media account for the current organization
   * Requires authentication and active organization
   */
  getAccount: organizationProcedure
    .input(
      z.object({
        platform: platformSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const account = await getSocialMediaAccount(
        ctx.organization.id,
        input.platform
      );
      return { account };
    }),

  /**
   * Refresh (re-scrape) a social media account
   * Returns the freshly scraped data
   * Requires authentication and active organization
   */
  refreshAccount: organizationProcedure
    .input(
      z.object({
        platform: platformSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const account = await refreshSocialMediaAccount(
        ctx.organization.id,
        input.platform
      );
      return { account };
    }),

  /**
   * Get Instagram posts for the current organization
   * Returns posts stored in the database, ordered by takenAt descending
   * Requires authentication and active organization
   */
  getInstagramPosts: organizationProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await getInstagramPostsForOrganization(
        ctx.organization.id,
        input.limit
      );
      return { posts };
    }),
});
