/**
 * Scraper package exports
 * Provides web scraping functionality
 */

// Client exports
export {
  ScrapingDogClient,
  scrapingDogClient,
} from "./clients/scrapingdog.client";

export {
  ScrapeCreatorClient,
  scrapeCreatorClient,
} from "./clients/scrapecreator.client";

// Scraper exports
export { scrapeWebsite } from "./scrapers/website.scraper";

// Social media scraper exports
export {
  scrapeInstagramProfile,
  extractInstagramHandle,
  type InstagramScrapingResult,
} from "./scrapers/social-media/instagram.scraper";

export {
  scrapeFacebookPage,
  extractFacebookHandle,
  type FacebookScrapingResult,
} from "./scrapers/social-media/facebook.scraper";
