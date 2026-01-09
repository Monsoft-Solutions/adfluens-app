/**
 * @monsoft/scraper
 * Web and social media scraping clients for ScrapingDog and ScrapeCreator APIs
 */

// ScrapingDog client exports
export {
  ScrapingDogClient,
  scrapingDogClient,
  getScrapingDogClient,
  type ScrapingDogClientConfig,
} from "./clients/scrapingdog.client";

// ScrapeCreator client exports
export {
  ScrapeCreatorClient,
  scrapeCreatorClient,
  getScrapeCreatorClient,
  type ScrapeCreatorClientConfig,
} from "./clients/scrapecreator.client";

// Website scraper (requires @monsoft/ai peer dependency)
export { scrapeWebsite } from "./scrapers/website.scraper";

// Social media scraper exports
export {
  scrapeInstagramProfile,
  extractInstagramHandle,
  type InstagramScrapingResult,
} from "./scrapers/social-media/instagram.scraper";

export {
  scrapeInstagramPosts,
  extractInstagramHandle as extractInstagramHandleForPosts,
  type InstagramPostsScrapingResult,
} from "./scrapers/social-media/instagram-posts.scraper";

export {
  scrapeFacebookPage,
  extractFacebookHandle,
  type FacebookScrapingResult,
} from "./scrapers/social-media/facebook.scraper";

export {
  scrapeTiktokProfile,
  extractTiktokHandle,
  type TiktokScrapingResult,
} from "./scrapers/social-media/tiktok.scraper";

export {
  scrapeTiktokPosts,
  type TiktokPostsScrapingResult,
} from "./scrapers/social-media/tiktok-posts.scraper";
