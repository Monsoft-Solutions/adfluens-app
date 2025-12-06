import { scrapingDogClient } from "../clients/scrapingdog.client";
import type {
  ScrapedBusinessInfo,
  WebsiteScrapingResult,
} from "../types/scraped-data.type";

/**
 * Parse markdown content to extract business information
 * Uses pattern matching to identify common business information patterns
 */
function parseBusinessInfo(markdown: string): ScrapedBusinessInfo {
  const info: ScrapedBusinessInfo = {
    rawContent: markdown,
  };

  // Extract business name from first H1 or title-like content
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match?.[1]) {
    info.businessName = h1Match[1].trim();
  }

  // Extract description from first paragraph or meta-like content
  const paragraphs = markdown.match(/^(?!#|\*|\-|\|)[A-Z].{20,200}\.$/gm);
  if (paragraphs && paragraphs.length > 0) {
    info.description = paragraphs[0]?.trim();
  }

  // Extract email addresses
  const emailMatch = markdown.match(/[\w.-]+@[\w.-]+\.\w{2,}/i);
  if (emailMatch?.[0]) {
    info.contactEmail = emailMatch[0];
  }

  // Extract phone numbers (various formats)
  const phoneMatch = markdown.match(
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
  );
  if (phoneMatch?.[0]) {
    info.contactPhone = phoneMatch[0];
  }

  // Extract services (look for service-related sections)
  const servicesSection = markdown.match(
    /(?:services|what we do|offerings?)[\s\S]*?(?=##|$)/i
  );
  if (servicesSection?.[0]) {
    const serviceItems = servicesSection[0].match(/(?:^|\n)[-*]\s+(.+)/g);
    if (serviceItems) {
      info.services = serviceItems
        .map((item) => item.replace(/^[\n-*\s]+/, "").trim())
        .filter((item) => item.length > 0 && item.length < 100);
    }
  }

  // Extract products (look for product-related sections)
  const productsSection = markdown.match(
    /(?:products|shop|store)[\s\S]*?(?=##|$)/i
  );
  if (productsSection?.[0]) {
    const productItems = productsSection[0].match(/(?:^|\n)[-*]\s+(.+)/g);
    if (productItems) {
      info.products = productItems
        .map((item) => item.replace(/^[\n-*\s]+/, "").trim())
        .filter((item) => item.length > 0 && item.length < 100);
    }
  }

  // Extract address patterns
  const addressMatch = markdown.match(
    /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)[\s,]+[\w\s]+,?\s*(?:[A-Z]{2})?\s*\d{5}(?:-\d{4})?/i
  );
  if (addressMatch?.[0]) {
    info.address = addressMatch[0].trim();
  }

  // Extract location from "Based in" or similar patterns
  const locationMatch = markdown.match(
    /(?:based in|located in|headquarters in|serving)\s+([^.|\n]{5,50})/i
  );
  if (locationMatch?.[1]) {
    info.location = locationMatch[1].trim();
  }

  // Extract year founded
  const foundedMatch = markdown.match(
    /(?:founded|established|since|est\.?)\s*(?:in\s+)?(\d{4})/i
  );
  if (foundedMatch?.[1]) {
    info.foundedYear = foundedMatch[1];
  }

  // Extract team size
  const teamMatch = markdown.match(
    /(\d+(?:\+)?)\s*(?:employees?|team members?|people|staff)/i
  );
  if (teamMatch?.[1]) {
    info.teamSize = teamMatch[1];
  }

  // Extract value propositions from bullet points near top
  const topContent = markdown.slice(0, 2000);
  const valueProps = topContent.match(/(?:^|\n)[-*]\s+([A-Z].{10,80})/g);
  if (valueProps && valueProps.length >= 2) {
    info.valuePropositions = valueProps
      .slice(0, 5)
      .map((item) => item.replace(/^[\n-*\s]+/, "").trim());
  }

  // Try to identify industry from keywords
  const industryKeywords: Record<string, string[]> = {
    Technology: ["software", "tech", "digital", "app", "platform", "saas"],
    Healthcare: ["health", "medical", "clinic", "hospital", "care", "wellness"],
    "E-commerce": ["shop", "store", "buy", "cart", "products", "retail"],
    Marketing: ["marketing", "advertising", "brand", "agency", "creative"],
    Finance: ["finance", "bank", "investment", "insurance", "loan"],
    "Real Estate": ["real estate", "property", "homes", "realty", "housing"],
    Education: ["education", "learning", "course", "training", "academy"],
    "Food & Beverage": ["restaurant", "food", "catering", "cafe", "dining"],
    "Beauty & Wellness": ["beauty", "salon", "spa", "cosmetic", "skincare"],
  };

  const lowerContent = markdown.toLowerCase();
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const matchCount = keywords.filter((kw) =>
      lowerContent.includes(kw)
    ).length;
    if (matchCount >= 2) {
      info.industry = industry;
      break;
    }
  }

  return info;
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

    // Parse the markdown to extract business information
    const businessInfo = parseBusinessInfo(markdown);

    return {
      success: true,
      data: businessInfo,
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

/**
 * Re-export for convenience
 */
export type { ScrapedBusinessInfo, WebsiteScrapingResult };
