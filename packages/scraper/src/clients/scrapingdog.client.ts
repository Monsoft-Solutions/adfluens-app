import axios, { AxiosError } from "axios";

/** ScrapingDog API base URL */
const SCRAPINGDOG_API_URL = "https://api.scrapingdog.com/scrape";

/** Retry configuration */
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

/**
 * Configuration options for ScrapingDogClient
 */
export type ScrapingDogClientConfig = {
  /** API key for ScrapingDog. Falls back to SCRAPINGDOG_API_KEY env variable if not provided */
  apiKey?: string;
};

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt - The current retry attempt (0-based)
 * @returns Delay in milliseconds
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 429;
  }
  return false;
}

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
 * Includes exponential backoff retry logic for rate limiting (429 errors)
 */
export class ScrapingDogClient {
  private apiKey: string;

  constructor(config: ScrapingDogClientConfig = {}) {
    const apiKey = config.apiKey ?? process.env.SCRAPINGDOG_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SCRAPINGDOG_API_KEY is required. Pass via constructor or set as environment variable."
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Scrape a URL and return its content
   * Implements exponential backoff retry for 429 rate limit errors
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

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
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
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapingDog] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
          );
          await sleep(delay);
          continue;
        }

        // For non-rate-limit errors or max retries exceeded, throw immediately
        throw error;
      }
    }

    // This should not be reached, but TypeScript needs it
    throw lastError;
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
 * Lazily initialized singleton instance of the ScrapingDog client.
 * Only instantiated when first accessed. Requires SCRAPINGDOG_API_KEY env variable.
 */
let _scrapingDogClientInstance: ScrapingDogClient | null = null;

export function getScrapingDogClient(): ScrapingDogClient {
  if (!_scrapingDogClientInstance) {
    _scrapingDogClientInstance = new ScrapingDogClient();
  }
  return _scrapingDogClientInstance;
}

/**
 * @deprecated Use getScrapingDogClient() for lazy initialization, or create your own instance with new ScrapingDogClient({ apiKey })
 */
export const scrapingDogClient = {
  get instance(): ScrapingDogClient {
    return getScrapingDogClient();
  },
  scrape: (url: string, options?: Parameters<ScrapingDogClient["scrape"]>[1]) =>
    getScrapingDogClient().scrape(url, options),
  scrapeAsMarkdown: (url: string, dynamic?: boolean) =>
    getScrapingDogClient().scrapeAsMarkdown(url, dynamic),
};
