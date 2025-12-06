/**
 * Scraper package exports
 * Provides web scraping functionality and organization profile schema
 */

// Schema exports
export {
  organizationProfile,
  organizationProfileRelations,
  type NewOrganizationProfile,
  type OrganizationProfile,
} from "./schema/organization-profile.table";

// Client exports
export {
  ScrapingDogClient,
  scrapingDogClient,
} from "./clients/scrapingdog.client";

// Scraper exports
export {
  scrapeWebsite,
  type ScrapedBusinessInfo,
  type WebsiteScrapingResult,
} from "./scrapers/website.scraper";

// Type exports
export { SocialPlatform } from "./types/social-platform.enum";
