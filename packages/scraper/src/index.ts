/**
 * Scraper package exports
 * Provides web scraping functionality and organization profile schema
 */

// Schema exports
export {
  organizationProfileTable,
  organizationProfileTableRelations,
  type OrganizationProfileInsert,
  type OrganizationProfileRow,
} from "./schema/organization-profile.table";

export {
  scrapedPageTable,
  scrapedPageTableRelations,
  type ScrapedPageInsert,
  type ScrapedPageRow,
} from "./schema/scraped-page.table";

export {
  socialMediaAccountTable,
  socialMediaAccountTableRelations,
  type SocialMediaAccountInsert,
  type SocialMediaAccountRow,
} from "./schema/social-media-account.table";

// Client exports
export {
  ScrapingDogClient,
  scrapingDogClient,
} from "./clients/scrapingdog.client";

// Scraper exports
export { scrapeWebsite } from "./scrapers/website.scraper";

// Type exports
export { SocialPlatform } from "./types/social-platform.enum";
