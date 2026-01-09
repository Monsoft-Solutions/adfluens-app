import { extractOrganizationProfile } from "@monsoft/ai/functions";
import type { WebsiteScrapingResult } from "@repo/types/organization/website-scraping-result.type";

import { scrapingDogClient } from "../clients/scrapingdog.client";

/**
 * Check if a URL is safe to scrape (prevents SSRF attacks)
 * Blocks localhost, private IPs, and cloud metadata endpoints
 */
function isUrlSafeToScrape(url: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variations
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0"
    ) {
      return { safe: false, reason: "Localhost URLs are not allowed" };
    }

    // Block private IP ranges (RFC 1918)
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const privateIpPatterns = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
    ];

    if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
      return { safe: false, reason: "Private IP addresses are not allowed" };
    }

    // Block link-local addresses (169.254.x.x) - used by cloud metadata services
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return {
        safe: false,
        reason: "Link-local addresses are not allowed",
      };
    }

    // Block internal hostnames
    const blockedHostnames = [
      "metadata.google.internal",
      "metadata.goog",
      "169.254.169.254", // AWS/GCP metadata
    ];

    if (blockedHostnames.includes(hostname)) {
      return {
        safe: false,
        reason: "Internal metadata endpoints are not allowed",
      };
    }

    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        safe: false,
        reason: `Protocol ${parsed.protocol} is not allowed`,
      };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }
}

/**
 * Normalize a URL by ensuring proper protocol and cleaning up common issues
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Remove any duplicate protocols (e.g., https://https://example.com)
  normalized = normalized.replace(/^(https?:\/\/)+/i, "");

  // Add https if no protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Validate the final URL
  try {
    const parsed = new URL(normalized);
    return parsed.href;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

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
    const normalizedUrl = normalizeUrl(url);

    // Check SSRF protection
    const safetyCheck = isUrlSafeToScrape(normalizedUrl);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: safetyCheck.reason ?? "URL is not allowed",
        url: normalizedUrl,
        scrapedAt,
      };
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
