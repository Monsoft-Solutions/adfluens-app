/**
 * Organization Profile Schema & Type
 *
 * Complete organization profile schema for AI extraction and validation.
 * This is the single source of truth for organization profile structure.
 *
 * Used by:
 * - @repo/ai for structured AI extraction
 * - @repo/scraper for data extraction types
 * - Frontend for display components
 *
 * @module @repo/types/organization/organization-profile
 */

import { z } from "zod";

import { brandVoiceSchema } from "./brand-voice.type";
import { businessModelSchema } from "./business-model.type";
import { competitivePositioningSchema } from "./competitive-positioning.type";
import { contentThemesSchema } from "./content-themes.type";
import { socialProofSchema } from "./social-proof.type";
import { targetAudienceSchema } from "./target-audience.type";

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

/**
 * Business information extracted from website scraping.
 * Comprehensive profile for content tailoring and generation.
 */
export type OrganizationProfile = z.infer<typeof organizationProfileSchema>;

/**
 * @deprecated Use OrganizationProfile instead. Kept for backwards compatibility.
 */
export type ScrapedBusinessInfo = OrganizationProfile;
