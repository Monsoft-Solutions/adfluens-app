import { extractOrganizationProfile } from "@monsoft/ai/functions";
import type { WebsiteScrapingResult } from "@repo/types/organization/website-scraping-result.type";

import { scrapingDogClient } from "../clients/scrapingdog.client";

/**
 * Scrape a website and extract business information
 * @param url - The website URL to scrape
 * @returns Scraped business information result
 */
export async function scrapeWebsite(
  url: string
): Promise<WebsiteScrapingResult> {
  const scrapedAt = new Date();

  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Scrape the website content as markdown
    const markdown = await scrapingDogClient.scrapeAsMarkdown(normalizedUrl);

    if (!markdown || markdown.trim().length === 0) {
      return {
        success: false,
        error: "No content retrieved from website",
        url: normalizedUrl,
        scrapedAt,
      };
    }

    // Extract business information using AI
    const businessInfo = await extractOrganizationProfile(markdown);

    return {
      success: true,
      data: businessInfo,
      rawContent: markdown,
      url: normalizedUrl,
      scrapedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: `Failed to scrape website: ${errorMessage}`,
      url,
      scrapedAt,
    };
  }
}
