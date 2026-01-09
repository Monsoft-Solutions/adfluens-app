import {
  db,
  eq,
  organizationProfileTable,
  scrapedPageTable,
  type OrganizationProfileRow,
} from "@repo/db";
import { scrapeWebsite } from "@monsoft/scraper";
import type { OrganizationProfile } from "@repo/types/organization/organization-profile.type";
import {
  scrapeInstagramProfileAndInitialPosts,
  scrapeAndSaveFacebookProfile,
  scrapeTiktokProfileAndInitialPosts,
} from "../social-media/social-media.service";

/**
 * Rate limiting for scraping operations
 * Prevents abuse by limiting how often scraping can be triggered per organization
 */
const SCRAPE_COOLDOWN_MS = 60000; // 1 minute cooldown between scrapes
const scrapingLastTriggered = new Map<string, number>();

/**
 * Check if scraping is allowed for an organization (rate limiting)
 * @returns true if scraping is allowed, false if rate limited
 */
function canTriggerScrape(organizationId: string): boolean {
  const lastTriggered = scrapingLastTriggered.get(organizationId);
  const now = Date.now();

  if (lastTriggered && now - lastTriggered < SCRAPE_COOLDOWN_MS) {
    return false;
  }

  scrapingLastTriggered.set(organizationId, now);
  return true;
}

/**
 * Input type for updating an organization profile
 */
export type UpdateProfileInput = {
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
};

/**
 * Get the organization profile for a given organization
 * Returns null if no profile exists
 */
export async function getOrganizationProfile(
  organizationId: string
): Promise<OrganizationProfileRow | null> {
  const result = await db
    .select()
    .from(organizationProfileTable)
    .where(eq(organizationProfileTable.organizationId, organizationId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create or update an organization profile
 * If profile doesn't exist, creates it; otherwise updates it
 * Automatically triggers website scraping if website URL changes
 * Automatically triggers Instagram scraping if Instagram URL changes
 * Automatically triggers Facebook scraping if Facebook URL changes
 * Automatically triggers TikTok scraping if TikTok URL changes
 * Uses atomic onConflictDoUpdate to prevent race conditions
 */
export async function upsertOrganizationProfile(
  organizationId: string,
  input: UpdateProfileInput
): Promise<OrganizationProfileRow> {
  // Get existing profile to detect URL changes for auto-scraping
  const existingProfile = await getOrganizationProfile(organizationId);

  // Determine final values for each field
  const websiteUrl = input.websiteUrl ?? existingProfile?.websiteUrl ?? null;
  const instagramUrl =
    input.instagramUrl ?? existingProfile?.instagramUrl ?? null;
  const facebookUrl = input.facebookUrl ?? existingProfile?.facebookUrl ?? null;
  const tiktokUrl = input.tiktokUrl ?? existingProfile?.tiktokUrl ?? null;
  const twitterUrl = input.twitterUrl ?? existingProfile?.twitterUrl ?? null;
  const linkedinUrl = input.linkedinUrl ?? existingProfile?.linkedinUrl ?? null;

  // Check if URLs changed (for auto-scraping)
  const websiteChanged =
    input.websiteUrl !== undefined &&
    input.websiteUrl !== existingProfile?.websiteUrl;
  const instagramChanged =
    input.instagramUrl !== undefined &&
    input.instagramUrl !== existingProfile?.instagramUrl;
  const facebookChanged =
    input.facebookUrl !== undefined &&
    input.facebookUrl !== existingProfile?.facebookUrl;
  const tiktokChanged =
    input.tiktokUrl !== undefined &&
    input.tiktokUrl !== existingProfile?.tiktokUrl;

  // Use atomic upsert to prevent race conditions
  const result = await db
    .insert(organizationProfileTable)
    .values({
      organizationId,
      websiteUrl,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      twitterUrl,
      linkedinUrl,
    })
    .onConflictDoUpdate({
      target: organizationProfileTable.organizationId,
      set: {
        websiteUrl,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        twitterUrl,
        linkedinUrl,
      },
    })
    .returning();

  const profile = result[0];
  if (!profile) {
    throw new Error("Failed to upsert organization profile");
  }

  // Trigger auto-scraping for changed URLs
  // Fire and forget - don't block the response
  if (websiteChanged && input.websiteUrl) {
    void scrapeAndUpdateProfile(profile.id, input.websiteUrl).catch((error) => {
      console.error(
        `[organization] Background website scrape failed for org ${organizationId}:`,
        error
      );
    });
  }

  if (instagramChanged && input.instagramUrl) {
    void scrapeInstagramProfileAndInitialPosts(
      profile.id,
      input.instagramUrl
    ).catch((error) => {
      console.error(
        `[organization] Background Instagram scrape failed for org ${organizationId}:`,
        error
      );
    });
  }

  // TODO: Facebook posts scraping not implemented
  // Currently only profile data is scraped, posts functionality is incomplete
  if (facebookChanged && input.facebookUrl) {
    void scrapeAndSaveFacebookProfile(profile.id, input.facebookUrl).catch(
      (error) => {
        console.error(
          `[organization] Background Facebook scrape failed for org ${organizationId}:`,
          error
        );
      }
    );
  }

  if (tiktokChanged && input.tiktokUrl) {
    void scrapeTiktokProfileAndInitialPosts(profile.id, input.tiktokUrl).catch(
      (error) => {
        console.error(
          `[organization] Background TikTok scrape failed for org ${organizationId}:`,
          error
        );
      }
    );
  }

  return profile;
}

/**
 * Scrape a website and update the profile with scraped data
 * This is called automatically when website URL changes
 * Saves raw content to scraped_page table and parsed data to organization_profile
 */
async function scrapeAndUpdateProfile(
  profileId: string,
  websiteUrl: string
): Promise<void> {
  try {
    const result = await scrapeWebsite(websiteUrl);

    if (result.success && result.data) {
      // Update organization profile with parsed data
      await db
        .update(organizationProfileTable)
        .set({
          scrapedData: result.data,
          scrapedAt: result.scrapedAt,
        })
        .where(eq(organizationProfileTable.id, profileId));

      // Save raw content to scraped_page table
      if (result.rawContent) {
        await db.insert(scrapedPageTable).values({
          organizationProfileId: profileId,
          pageUrl: result.url,
          content: result.rawContent,
          scrapedAt: result.scrapedAt,
        });
      }
    } else {
      console.error(
        `[organization] Failed to scrape website ${websiteUrl}:`,
        result.error
      );
    }
  } catch (error) {
    console.error(
      `[organization] Error scraping website ${websiteUrl}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Manually trigger website scraping for an organization profile
 * Returns the scraped data or throws an error
 * Saves raw content to scraped_page table and parsed data to organization_profile
 * Rate limited to prevent abuse
 */
export async function rescrapeOrganizationWebsite(
  organizationId: string
): Promise<OrganizationProfile | null> {
  // Check rate limiting
  if (!canTriggerScrape(organizationId)) {
    throw new Error(
      "Rate limited: Please wait before triggering another scrape"
    );
  }

  const profile = await getOrganizationProfile(organizationId);

  if (!profile) {
    throw new Error("Organization profile not found");
  }

  if (!profile.websiteUrl) {
    throw new Error("No website URL configured for this organization");
  }

  const result = await scrapeWebsite(profile.websiteUrl);

  if (!result.success) {
    throw new Error(result.error || "Failed to scrape website");
  }

  // Update the profile with parsed data
  await db
    .update(organizationProfileTable)
    .set({
      scrapedData: result.data ?? null,
      scrapedAt: result.scrapedAt,
    })
    .where(eq(organizationProfileTable.id, profile.id));

  // Save raw content to scraped_page table
  if (result.rawContent) {
    await db.insert(scrapedPageTable).values({
      organizationProfileId: profile.id,
      pageUrl: result.url,
      content: result.rawContent,
      scrapedAt: result.scrapedAt,
    });
  }

  return result.data ?? null;
}
