/**
 * Business information extracted from website scraping
 * Note: Raw content is stored separately in the scraped_page table
 */
export type ScrapedBusinessInfo = {
  /** Business or company name */
  businessName?: string;

  /** Business description or tagline */
  description?: string;

  /** Industry or business category */
  industry?: string;

  /** List of services offered */
  services?: string[];

  /** List of products offered */
  products?: string[];

  /** Contact email address */
  contactEmail?: string;

  /** Contact phone number */
  contactPhone?: string;

  /** Physical address */
  address?: string;

  /** Business location (city, state, country) */
  location?: string;

  /** Year founded or established */
  foundedYear?: string;

  /** Team size or employee count */
  teamSize?: string;

  /** Key value propositions or unique selling points */
  valuePropositions?: string[];

  /** Target audience or customer segments */
  targetAudience?: string[];
};

/**
 * Result from a website scraping operation
 */
export type WebsiteScrapingResult = {
  /** Whether the scraping was successful */
  success: boolean;

  /** Extracted business information (parsed data) */
  data?: ScrapedBusinessInfo;

  /** Raw webpage content (markdown) - stored separately in scraped_page table */
  rawContent?: string;

  /** Error message if scraping failed */
  error?: string;

  /** URL that was scraped */
  url: string;

  /** Timestamp of when the scraping occurred */
  scrapedAt: Date;
};
