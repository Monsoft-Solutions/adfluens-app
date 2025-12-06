import { eq } from "drizzle-orm";
import { db } from "@repo/db/client";
import {
  organizationProfile,
  scrapeWebsite,
  type OrganizationProfile,
  type ScrapedBusinessInfo,
} from "@repo/scraper";

/**
 * Generate a unique ID for new organization profiles
 */
function generateId(): string {
  return `org_profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
): Promise<OrganizationProfile | null> {
  const result = await db
    .select()
    .from(organizationProfile)
    .where(eq(organizationProfile.organizationId, organizationId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create or update an organization profile
 * If profile doesn't exist, creates it; otherwise updates it
 * Automatically triggers website scraping if website URL changes
 */
export async function upsertOrganizationProfile(
  organizationId: string,
  input: UpdateProfileInput
): Promise<OrganizationProfile> {
  const existingProfile = await getOrganizationProfile(organizationId);

  // Check if website URL changed (for auto-scraping)
  const websiteChanged =
    input.websiteUrl !== undefined &&
    input.websiteUrl !== existingProfile?.websiteUrl;

  if (existingProfile) {
    // Update existing profile
    const result = await db
      .update(organizationProfile)
      .set({
        websiteUrl: input.websiteUrl ?? existingProfile.websiteUrl,
        instagramUrl: input.instagramUrl ?? existingProfile.instagramUrl,
        facebookUrl: input.facebookUrl ?? existingProfile.facebookUrl,
        tiktokUrl: input.tiktokUrl ?? existingProfile.tiktokUrl,
        twitterUrl: input.twitterUrl ?? existingProfile.twitterUrl,
        linkedinUrl: input.linkedinUrl ?? existingProfile.linkedinUrl,
      })
      .where(eq(organizationProfile.id, existingProfile.id))
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

    return updatedProfile;
  } else {
    // Create new profile
    const result = await db
      .insert(organizationProfile)
      .values({
        id: generateId(),
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

    return newProfile;
  }
}

/**
 * Scrape a website and update the profile with scraped data
 * This is called automatically when website URL changes
 */
async function scrapeAndUpdateProfile(
  profileId: string,
  websiteUrl: string
): Promise<void> {
  try {
    const result = await scrapeWebsite(websiteUrl);

    if (result.success && result.data) {
      await db
        .update(organizationProfile)
        .set({
          scrapedData: result.data,
          scrapedAt: result.scrapedAt,
        })
        .where(eq(organizationProfile.id, profileId));
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

  // Update the profile with scraped data
  await db
    .update(organizationProfile)
    .set({
      scrapedData: result.data ?? null,
      scrapedAt: result.scrapedAt,
    })
    .where(eq(organizationProfile.id, profile.id));

  return result.data ?? null;
}
