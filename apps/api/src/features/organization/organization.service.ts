import {
  db,
  eq,
  organizationProfileTable,
  scrapedPageTable,
  type OrganizationProfileRow,
} from "@repo/db";
import { scrapeWebsite } from "@repo/scraper";
import type { ScrapedBusinessInfo } from "@repo/types/organization/organization-profile.type";
import {
  scrapeAndSaveInstagramProfile,
  scrapeAndSaveFacebookProfile,
} from "../social-media/social-media.service";

/**
 * Generate a unique ID for new organization profiles
 */
function generateProfileId(): string {
  return `org_profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique ID for scraped pages
 */
function generateScrapedPageId(): string {
  return `scraped_page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 */
export async function upsertOrganizationProfile(
  organizationId: string,
  input: UpdateProfileInput
): Promise<OrganizationProfileRow> {
  const existingProfile = await getOrganizationProfile(organizationId);

  // Check if website URL changed (for auto-scraping)
  const websiteChanged =
    input.websiteUrl !== undefined &&
    input.websiteUrl !== existingProfile?.websiteUrl;

  // Check if Instagram URL changed (for auto-scraping)
  const instagramChanged =
    input.instagramUrl !== undefined &&
    input.instagramUrl !== existingProfile?.instagramUrl;

  // Check if Facebook URL changed (for auto-scraping)
  const facebookChanged =
    input.facebookUrl !== undefined &&
    input.facebookUrl !== existingProfile?.facebookUrl;

  if (existingProfile) {
    // Update existing profile
    const result = await db
      .update(organizationProfileTable)
      .set({
        websiteUrl: input.websiteUrl ?? existingProfile.websiteUrl,
        instagramUrl: input.instagramUrl ?? existingProfile.instagramUrl,
        facebookUrl: input.facebookUrl ?? existingProfile.facebookUrl,
        tiktokUrl: input.tiktokUrl ?? existingProfile.tiktokUrl,
        twitterUrl: input.twitterUrl ?? existingProfile.twitterUrl,
        linkedinUrl: input.linkedinUrl ?? existingProfile.linkedinUrl,
      })
      .where(eq(organizationProfileTable.id, existingProfile.id))
      .returning();

    const updatedProfile = result[0];
    if (!updatedProfile) {
      throw new Error("Failed to update organization profile");
    }

    // Auto-scrape if website URL changed and is not empty
    if (websiteChanged && input.websiteUrl) {
      // Fire and forget scraping - don't block the response
      void scrapeAndUpdateProfile(updatedProfile.id, input.websiteUrl);
    }

    // Auto-scrape Instagram if URL changed and is not empty
    if (instagramChanged && input.instagramUrl) {
      // Fire and forget scraping - don't block the response
      void scrapeAndSaveInstagramProfile(updatedProfile.id, input.instagramUrl);
    }

    // Auto-scrape Facebook if URL changed and is not empty
    if (facebookChanged && input.facebookUrl) {
      // Fire and forget scraping - don't block the response
      void scrapeAndSaveFacebookProfile(updatedProfile.id, input.facebookUrl);
    }

    return updatedProfile;
  } else {
    // Create new profile
    const result = await db
      .insert(organizationProfileTable)
      .values({
        id: generateProfileId(),
        organizationId,
        websiteUrl: input.websiteUrl ?? null,
        instagramUrl: input.instagramUrl ?? null,
        facebookUrl: input.facebookUrl ?? null,
        tiktokUrl: input.tiktokUrl ?? null,
        twitterUrl: input.twitterUrl ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
      })
      .returning();

    const newProfile = result[0];
    if (!newProfile) {
      throw new Error("Failed to create organization profile");
    }

    // Auto-scrape if website URL is provided
    if (input.websiteUrl) {
      void scrapeAndUpdateProfile(newProfile.id, input.websiteUrl);
    }

    // Auto-scrape Instagram if URL is provided
    if (input.instagramUrl) {
      void scrapeAndSaveInstagramProfile(newProfile.id, input.instagramUrl);
    }

    // Auto-scrape Facebook if URL is provided
    if (input.facebookUrl) {
      void scrapeAndSaveFacebookProfile(newProfile.id, input.facebookUrl);
    }

    return newProfile;
  }
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
          id: generateScrapedPageId(),
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
 */
export async function rescrapeOrganizationWebsite(
  organizationId: string
): Promise<ScrapedBusinessInfo | null> {
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
      id: generateScrapedPageId(),
      organizationProfileId: profile.id,
      pageUrl: result.url,
      content: result.rawContent,
      scrapedAt: result.scrapedAt,
    });
  }

  return result.data ?? null;
}
