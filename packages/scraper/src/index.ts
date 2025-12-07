/**
 * Scraper package exports
 * Provides web scraping functionality
 */

// Client exports
export {
  ScrapingDogClient,
  scrapingDogClient,
} from "./clients/scrapingdog.client";

// Scraper exports
export { scrapeWebsite } from "./scrapers/website.scraper";
