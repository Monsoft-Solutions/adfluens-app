import axios from "axios";
import { env } from "@repo/env";

/** ScrapingDog API base URL */
const SCRAPINGDOG_API_URL = "https://api.scrapingdog.com/scrape";

/**
 * Parameters for ScrapingDog API request
 */
type ScrapingDogParams = {
  /** Target URL to scrape */
  url: string;

  /** Whether to use dynamic rendering (JavaScript execution) */
  dynamic?: boolean;

  /** Whether to return content as markdown */
  markdown?: boolean;
};

/**
 * Response from ScrapingDog API
 */
type ScrapingDogResponse = {
  /** Scraped content (HTML or markdown depending on settings) */
  data: string;

  /** HTTP status code of the scraped page */
  status?: number;
};

/**
 * ScrapingDog API client for web scraping
 * Uses ScrapingDog's API to fetch and parse web page content
 */
export class ScrapingDogClient {
  private apiKey: string;

  constructor() {
    this.apiKey = env.SCRAPINGDOG_API_KEY;
  }

  /**
   * Scrape a URL and return its content
   * @param url - The URL to scrape
   * @param options - Additional scraping options
   * @returns The scraped content as a string
   */
  async scrape(
    url: string,
    options: Omit<ScrapingDogParams, "url"> = {}
  ): Promise<string> {
    const params = {
      api_key: this.apiKey,
      url,
      dynamic: options.dynamic ? "true" : "false",
      markdown: options.markdown ? "true" : "false",
    };

    const response = await axios.get<ScrapingDogResponse | string>(
      SCRAPINGDOG_API_URL,
      {
        params,
        timeout: 30000, // 30 second timeout
      }
    );

    // ScrapingDog returns the content directly as string when markdown is true
    if (typeof response.data === "string") {
      return response.data;
    }

    return response.data.data;
  }

  /**
   * Scrape a URL and return content as markdown
   * This is the preferred method for extracting text content
   * @param url - The URL to scrape
   * @param dynamic - Whether to use dynamic rendering for JavaScript-heavy sites
   * @returns The scraped content as markdown
   */
  async scrapeAsMarkdown(url: string, dynamic = false): Promise<string> {
    return this.scrape(url, { markdown: true, dynamic });
  }
}

/**
 * Singleton instance of the ScrapingDog client
 */
export const scrapingDogClient = new ScrapingDogClient();
