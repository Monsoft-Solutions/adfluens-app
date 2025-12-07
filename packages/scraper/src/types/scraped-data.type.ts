/**
 * Scraped Data Types & Schemas
 *
 * Re-exports organization profile schemas and types from @repo/types.
 * @repo/types is the single source of truth for these definitions.
 *
 * New code should import directly from @repo/types/organization/organization-profile.type
 *
 * @module @repo/scraper/types
 */

// Re-export schemas for validation
export {
  organizationProfileSchema,
  brandVoiceSchema,
  targetAudienceSchema,
  competitivePositioningSchema,
  contentThemesSchema,
  businessModelSchema,
  socialProofSchema,
  websiteScrapingResultSchema,
} from "@repo/types/organization/organization-profile.type";

// Re-export types
export type {
  OrganizationProfile,
  BrandVoice,
  TargetAudienceDetails,
  CompetitivePositioning,
  ContentThemes,
  BusinessModel,
  SocialProof,
  WebsiteScrapingResult,
  // Backwards compatible alias
  ScrapedBusinessInfo,
} from "@repo/types/organization/organization-profile.type";
