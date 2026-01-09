import axios, { AxiosError } from "axios";
import type { ScrapecreatorInstagramProfileResponse } from "@repo/types/scrapecreator/scrapecreator-instagram-profile.type";
import type { ScrapecreatorInstagramPostsResponse } from "@repo/types/scrapecreator/scrapecreator-instagram-posts.type";
import type { ScrapecreatorFacebookPageResponse } from "@repo/types/scrapecreator/scrapecreator-facebook-page.type";
import type { ScrapecreatorTiktokProfileResponse } from "@repo/types/scrapecreator/scrapecreator-tiktok-profile.type";
import type { ScrapecreatorTiktokPostsResponse } from "@repo/types/scrapecreator/scrapecreator-tiktok-posts.type";

/**
 * Configuration options for ScrapeCreatorClient
 */
export type ScrapeCreatorClientConfig = {
  /** API key for ScrapeCreator. Falls back to SCRAPECREATOR_API_KEY env variable if not provided */
  apiKey?: string;
};

/** ScrapeCreator API base URLs */
const SCRAPECREATOR_API_URL = "https://api.scrapecreators.com/v1";
const SCRAPECREATOR_API_URL_V2 = "https://api.scrapecreators.com/v2";
const SCRAPECREATOR_API_URL_V3 = "https://api.scrapecreators.com/v3";

/** Retry configuration */
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

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
 * ScrapeCreator API client for social media scraping
 * Uses ScrapeCreator's API to fetch social media profile data
 * Includes exponential backoff retry logic for rate limiting (429 errors)
 */
export class ScrapeCreatorClient {
  private apiKey: string;

  constructor(config: ScrapeCreatorClientConfig = {}) {
    const apiKey = config.apiKey ?? process.env.SCRAPECREATOR_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SCRAPECREATOR_API_KEY is required. Pass via constructor or set as environment variable."
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Scrape an Instagram profile by handle using ScrapeCreator API
   * Implements exponential backoff retry for 429 rate limit errors
   * @param handle - The Instagram username/handle (without @)
   * @returns The Instagram profile data from ScrapeCreator
   */
  async scrapeInstagramProfile(
    handle: string
  ): Promise<ScrapecreatorInstagramProfileResponse> {
    const url = `${SCRAPECREATOR_API_URL}/instagram/profile`;
    const params = {
      handle: handle.replace(/^@/, ""), // Remove @ if present
      trim: "true",
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<ScrapecreatorInstagramProfileResponse>(
          url,
          {
            params,
            headers: {
              "x-api-key": this.apiKey,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data.success) {
          throw new Error("ScrapeCreator API returned unsuccessful response");
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapeCreator] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
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
   * Scrape a Facebook page/profile using ScrapeCreator API
   * Implements exponential backoff retry for 429 rate limit errors
   * @param facebookUrl - The full Facebook page URL (e.g., "https://www.facebook.com/breastaugmentationmiami/")
   * @returns The Facebook page data from ScrapeCreator
   */
  async scrapeFacebookProfile(
    facebookUrl: string
  ): Promise<ScrapecreatorFacebookPageResponse> {
    const url = `${SCRAPECREATOR_API_URL}/facebook/profile`;
    const params = {
      url: facebookUrl,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<ScrapecreatorFacebookPageResponse>(
          url,
          {
            params,
            headers: {
              "x-api-key": this.apiKey,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data.success) {
          throw new Error("ScrapeCreator API returned unsuccessful response");
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapeCreator] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
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
   * Scrape a TikTok profile using ScrapeCreator API
   * Implements exponential backoff retry for 429 rate limit errors
   * @param handle - The TikTok username/handle (without @)
   * @returns The TikTok profile data from ScrapeCreator
   */
  async scrapeTiktokProfile(
    handle: string
  ): Promise<ScrapecreatorTiktokProfileResponse> {
    const url = `${SCRAPECREATOR_API_URL}/tiktok/profile`;
    const params = {
      handle: handle.replace(/^@/, ""), // Remove @ if present
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<ScrapecreatorTiktokProfileResponse>(
          url,
          {
            params,
            headers: {
              "x-api-key": this.apiKey,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data.success) {
          throw new Error("ScrapeCreator API returned unsuccessful response");
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapeCreator] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
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
   * Scrape Instagram posts for a user using ScrapeCreator API v2
   * Implements exponential backoff retry for 429 rate limit errors
   * @param handle - The Instagram username/handle (without @)
   * @param cursor - Optional pagination cursor (next_max_id from previous response)
   * @returns The Instagram posts data from ScrapeCreator
   */
  async scrapeInstagramPosts(
    handle: string,
    cursor?: string
  ): Promise<ScrapecreatorInstagramPostsResponse> {
    const url = `${SCRAPECREATOR_API_URL_V2}/instagram/user/posts`;
    const params: Record<string, string> = {
      handle: handle.replace(/^@/, ""), // Remove @ if present
      trim: "true",
    };

    // Add pagination cursor if provided
    if (cursor) {
      params.max_id = cursor;
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<ScrapecreatorInstagramPostsResponse>(
          url,
          {
            params,
            headers: {
              "x-api-key": this.apiKey,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data.success) {
          throw new Error("ScrapeCreator API returned unsuccessful response");
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapeCreator] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
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
   * Scrape TikTok posts for a user using ScrapeCreator API v3
   * Implements exponential backoff retry for 429 rate limit errors
   * @param handle - The TikTok username/handle (without @)
   * @param cursor - Optional pagination cursor (max_cursor from previous response)
   * @returns The TikTok posts data from ScrapeCreator
   */
  async scrapeTiktokPosts(
    handle: string,
    cursor?: number
  ): Promise<ScrapecreatorTiktokPostsResponse> {
    const url = `${SCRAPECREATOR_API_URL_V3}/tiktok/profile/videos`;
    const params: Record<string, string | number> = {
      handle: handle.replace(/^@/, ""), // Remove @ if present
      sort_by: "latest",
      trim: "true",
    };

    // Add pagination cursor if provided
    if (cursor !== undefined) {
      params.cursor = cursor;
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<ScrapecreatorTiktokPostsResponse>(
          url,
          {
            params,
            headers: {
              "x-api-key": this.apiKey,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data.success) {
          throw new Error("ScrapeCreator API returned unsuccessful response");
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on rate limit errors (429)
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.warn(
            `[ScrapeCreator] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
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
}

/**
 * Lazily initialized singleton instance of the ScrapeCreator client.
 * Only instantiated when first accessed. Requires SCRAPECREATOR_API_KEY env variable.
 */
let _scrapeCreatorClientInstance: ScrapeCreatorClient | null = null;

export function getScrapeCreatorClient(): ScrapeCreatorClient {
  if (!_scrapeCreatorClientInstance) {
    _scrapeCreatorClientInstance = new ScrapeCreatorClient();
  }
  return _scrapeCreatorClientInstance;
}

/**
 * @deprecated Use getScrapeCreatorClient() for lazy initialization, or create your own instance with new ScrapeCreatorClient({ apiKey })
 */
export const scrapeCreatorClient = {
  get instance(): ScrapeCreatorClient {
    return getScrapeCreatorClient();
  },
  scrapeInstagramProfile: (handle: string) =>
    getScrapeCreatorClient().scrapeInstagramProfile(handle),
  scrapeFacebookProfile: (facebookUrl: string) =>
    getScrapeCreatorClient().scrapeFacebookProfile(facebookUrl),
  scrapeTiktokProfile: (handle: string) =>
    getScrapeCreatorClient().scrapeTiktokProfile(handle),
  scrapeInstagramPosts: (handle: string, cursor?: string) =>
    getScrapeCreatorClient().scrapeInstagramPosts(handle, cursor),
  scrapeTiktokPosts: (handle: string, cursor?: number) =>
    getScrapeCreatorClient().scrapeTiktokPosts(handle, cursor),
};
