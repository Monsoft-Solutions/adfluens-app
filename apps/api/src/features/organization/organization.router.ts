import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import {
  getOrganizationProfile,
  upsertOrganizationProfile,
  rescrapeOrganizationWebsite,
} from "./organization.service";

/**
 * Schema for updating organization profile
 */
const updateProfileSchema = z.object({
  websiteUrl: z.string().url().nullable().optional(),
  instagramUrl: z.string().url().nullable().optional(),
  facebookUrl: z.string().url().nullable().optional(),
  tiktokUrl: z.string().url().nullable().optional(),
  twitterUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
});

export const organizationRouter = router({
  /**
   * Get the current organization's profile
   * Requires authentication and active organization
   */
  getProfile: organizationProcedure.query(async ({ ctx }) => {
    const profile = await getOrganizationProfile(ctx.organization.id);
    return { profile };
  }),

  /**
   * Update the current organization's profile
   * Creates the profile if it doesn't exist
   * Auto-triggers website scraping when website URL changes
   * Requires authentication and active organization
   */
  updateProfile: organizationProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await upsertOrganizationProfile(ctx.organization.id, {
        websiteUrl: input.websiteUrl,
        instagramUrl: input.instagramUrl,
        facebookUrl: input.facebookUrl,
        tiktokUrl: input.tiktokUrl,
        twitterUrl: input.twitterUrl,
        linkedinUrl: input.linkedinUrl,
      });
      return { profile };
    }),

  /**
   * Manually trigger website scraping for the organization
   * Returns the freshly scraped data
   * Requires authentication and active organization
   */
  rescrapeWebsite: organizationProcedure.mutation(async ({ ctx }) => {
    const scrapedData = await rescrapeOrganizationWebsite(ctx.organization.id);
    return { scrapedData };
  }),
});
