/**
 * Organization Profile Schema & Types
 *
 * Zod schemas as the single source of truth for organization profile data.
 * Types are inferred from schemas to ensure consistency.
 *
 * Used by:
 * - @repo/ai for structured AI extraction
 * - @repo/scraper for data extraction types
 * - Frontend for display components
 *
 * @module @repo/types/organization/organization-profile.type
 */

import { z } from "zod";

// ============================================================================
// Sub-Schemas
// ============================================================================

/**
 * Brand voice and tone schema
 */
export const brandVoiceSchema = z.object({
  /** Overall communication tone (e.g., formal, casual, professional, friendly, authoritative, playful) */
  tone: z
    .string()
    .describe(
      "Overall communication tone (e.g., formal, casual, professional, friendly, authoritative, playful)"
    )
    .optional(),

  /** Brand personality traits (e.g., innovative, trustworthy, bold, approachable, expert, caring) */
  personality: z
    .array(z.string())
    .describe(
      "Brand personality traits (e.g., innovative, trustworthy, bold, approachable, expert, caring)"
    )
    .optional(),

  /** Description of how the brand communicates (e.g., direct and concise, storytelling-focused, data-driven) */
  communicationStyle: z
    .string()
    .describe(
      "Description of how the brand communicates (e.g., direct and concise, storytelling-focused, data-driven)"
    )
    .optional(),
});

/**
 * Target audience details schema
 */
export const targetAudienceSchema = z.object({
  /** Demographic segments (e.g., small business owners, enterprise CTOs, millennials, parents) */
  demographics: z
    .array(z.string())
    .describe(
      "Demographic segments (e.g., small business owners, enterprise CTOs, millennials, parents)"
    )
    .optional(),

  /** Key pain points and challenges the audience faces that the business addresses */
  painPoints: z
    .array(z.string())
    .describe(
      "Key pain points and challenges the audience faces that the business addresses"
    )
    .optional(),

  /** Goals, desires, and aspirations of the target audience */
  aspirations: z
    .array(z.string())
    .describe("Goals, desires, and aspirations of the target audience")
    .optional(),

  /** Distinct customer segments or personas the business serves */
  segments: z
    .array(z.string())
    .describe("Distinct customer segments or personas the business serves")
    .optional(),
});

/**
 * Competitive positioning schema
 */
export const competitivePositioningSchema = z.object({
  /** What makes this business unique compared to competitors */
  uniqueDifferentiators: z
    .array(z.string())
    .describe("What makes this business unique compared to competitors")
    .optional(),

  /** Market position description (e.g., premium provider, budget-friendly option, market leader, niche specialist) */
  marketPosition: z
    .string()
    .describe(
      "Market position description (e.g., premium provider, budget-friendly option, market leader, niche specialist)"
    )
    .optional(),

  /** Key competitive advantages and strengths */
  competitiveAdvantages: z
    .array(z.string())
    .describe("Key competitive advantages and strengths")
    .optional(),
});

/**
 * Content themes schema
 */
export const contentThemesSchema = z.object({
  /** Primary topics and subjects the business focuses on */
  mainTopics: z
    .array(z.string())
    .describe("Primary topics and subjects the business focuses on")
    .optional(),

  /** Content pillars or main categories of content (e.g., education, inspiration, product updates) */
  contentPillars: z
    .array(z.string())
    .describe(
      "Content pillars or main categories of content (e.g., education, inspiration, product updates)"
    )
    .optional(),

  /** Relevant keywords and phrases associated with the business */
  keywords: z
    .array(z.string())
    .describe("Relevant keywords and phrases associated with the business")
    .optional(),
});

/**
 * Business model schema
 */
export const businessModelSchema = z.object({
  /** Pricing tiers or plans offered (e.g., Free, Pro, Enterprise) */
  pricingTiers: z
    .array(z.string())
    .describe("Pricing tiers or plans offered (e.g., Free, Pro, Enterprise)")
    .optional(),

  /** How the business makes money (e.g., subscription, one-time purchase, freemium, advertising) */
  monetization: z
    .string()
    .describe(
      "How the business makes money (e.g., subscription, one-time purchase, freemium, advertising)"
    )
    .optional(),

  /** Description of the typical customer journey or sales process */
  customerJourney: z
    .string()
    .describe("Description of the typical customer journey or sales process")
    .optional(),
});

/**
 * Social proof schema
 */
export const socialProofSchema = z.object({
  /** Common themes or sentiments from customer testimonials and reviews */
  testimonialThemes: z
    .array(z.string())
    .describe(
      "Common themes or sentiments from customer testimonials and reviews"
    )
    .optional(),

  /** Professional certifications, accreditations, or compliance badges */
  certifications: z
    .array(z.string())
    .describe(
      "Professional certifications, accreditations, or compliance badges"
    )
    .optional(),

  /** Awards, recognitions, or honors received */
  awards: z
    .array(z.string())
    .describe("Awards, recognitions, or honors received")
    .optional(),

  /** Key highlights or results from case studies */
  caseStudyHighlights: z
    .array(z.string())
    .describe("Key highlights or results from case studies")
    .optional(),
});

// ============================================================================
// Main Organization Profile Schema
// ============================================================================

/**
 * Complete organization profile schema for AI extraction and validation.
 * This is the single source of truth for organization profile structure.
 */
export const organizationProfileSchema = z.object({
  // === Core Business Information ===

  /** The official business or company name */
  businessName: z
    .string()
    .describe("The official business or company name")
    .optional(),

  /** A concise business description, tagline, or mission statement */
  description: z
    .string()
    .describe("A concise business description, tagline, or mission statement")
    .optional(),

  /** The industry or business category (e.g., Technology, Healthcare, E-commerce, Marketing) */
  industry: z
    .string()
    .describe(
      "The industry or business category (e.g., Technology, Healthcare, E-commerce, Marketing)"
    )
    .optional(),

  /** List of services offered by the business */
  services: z
    .array(z.string())
    .describe("List of services offered by the business")
    .optional(),

  /** List of products offered by the business */
  products: z
    .array(z.string())
    .describe("List of products offered by the business")
    .optional(),

  /** Primary contact email address */
  contactEmail: z.string().describe("Primary contact email address").optional(),

  /** Primary contact phone number */
  contactPhone: z.string().describe("Primary contact phone number").optional(),

  /** Physical business address */
  address: z.string().describe("Physical business address").optional(),

  /** Business location (city, state, country) */
  location: z
    .string()
    .describe("Business location (city, state, country)")
    .optional(),

  /** Year the business was founded or established */
  foundedYear: z
    .string()
    .describe("Year the business was founded or established")
    .optional(),

  /** Team size or employee count (e.g., '10-50', '500+') */
  teamSize: z
    .string()
    .describe("Team size or employee count (e.g., '10-50', '500+')")
    .optional(),

  /** Key value propositions or unique selling points */
  valuePropositions: z
    .array(z.string())
    .describe("Key value propositions or unique selling points")
    .optional(),

  // === Extended Profile for Content Tailoring ===

  /** Brand voice and communication characteristics */
  brandVoice: brandVoiceSchema
    .describe("Brand voice and communication characteristics")
    .optional(),

  /** Detailed target audience information */
  targetAudience: targetAudienceSchema
    .describe("Detailed target audience information")
    .optional(),

  /** Competitive positioning and market differentiation */
  competitivePositioning: competitivePositioningSchema
    .describe("Competitive positioning and market differentiation")
    .optional(),

  /** Content themes, topics, and keywords */
  contentThemes: contentThemesSchema
    .describe("Content themes, topics, and keywords")
    .optional(),

  /** Business model and monetization details */
  businessModel: businessModelSchema
    .describe("Business model and monetization details")
    .optional(),

  /** Social proof elements like testimonials and awards */
  socialProof: socialProofSchema
    .describe("Social proof elements like testimonials and awards")
    .optional(),
});

// ============================================================================
// Website Scraping Result Schema
// ============================================================================

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

// ============================================================================
// Inferred Types (derived from schemas)
// ============================================================================

/** Brand voice and tone characteristics */
export type BrandVoice = z.infer<typeof brandVoiceSchema>;

/** Target audience details for content tailoring */
export type TargetAudienceDetails = z.infer<typeof targetAudienceSchema>;

/** Competitive positioning information */
export type CompetitivePositioning = z.infer<
  typeof competitivePositioningSchema
>;

/** Content themes and topics */
export type ContentThemes = z.infer<typeof contentThemesSchema>;

/** Business model information */
export type BusinessModel = z.infer<typeof businessModelSchema>;

/** Social proof elements */
export type SocialProof = z.infer<typeof socialProofSchema>;

/**
 * Business information extracted from website scraping.
 * Comprehensive profile for content tailoring and generation.
 */
export type OrganizationProfile = z.infer<typeof organizationProfileSchema>;

/** Result from a website scraping operation */
export type WebsiteScrapingResult = z.infer<typeof websiteScrapingResultSchema>;

/**
 * @deprecated Use OrganizationProfile instead. Kept for backwards compatibility.
 */
export type ScrapedBusinessInfo = OrganizationProfile;
