/**
 * Website Scraping Result Schema & Type
 *
 * Defines the result structure for website scraping operations.
 *
 * @module @repo/types/organization/website-scraping-result
 */

import { z } from "zod";

import { organizationProfileSchema } from "./organization-profile.type";

/**
 * Result from a website scraping operation
 */
export const websiteScrapingResultSchema = z.object({
  /** Whether the scraping was successful */
  success: z.boolean().describe("Whether the scraping was successful"),

  /** Extracted business information (parsed data) */
  data: organizationProfileSchema.optional(),

  /** Raw webpage content (markdown) - stored separately in scraped_page table */
  rawContent: z.string().optional(),

  /** Error message if scraping failed */
  error: z.string().optional(),

  /** URL that was scraped */
  url: z.string().describe("URL that was scraped"),

  /** Timestamp of when the scraping occurred */
  scrapedAt: z.date().describe("Timestamp of when the scraping occurred"),
});

/** Result from a website scraping operation */
export type WebsiteScrapingResult = z.infer<typeof websiteScrapingResultSchema>;
