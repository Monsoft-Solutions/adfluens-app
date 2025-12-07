/**
 * @repo/ai/schemas
 *
 * Re-exports Zod schemas from @repo/types for AI structured outputs.
 * The schemas are defined in @repo/types as the single source of truth.
 *
 * @module @repo/ai/schemas
 */

export const SCHEMAS_VERSION = "0.0.1";

// Organization profile extraction schemas (re-exported from @repo/types)
export {
  organizationProfileSchema,
  brandVoiceSchema,
  targetAudienceSchema,
  competitivePositioningSchema,
  contentThemesSchema,
  businessModelSchema,
  socialProofSchema,
  websiteScrapingResultSchema,
  type OrganizationProfile,
  type BrandVoice,
  type TargetAudienceDetails,
  type CompetitivePositioning,
  type ContentThemes,
  type BusinessModel,
  type SocialProof,
  type WebsiteScrapingResult,
} from "@repo/types/organization/organization-profile.type";

// Alias for backwards compatibility
export type { OrganizationProfile as OrganizationProfileExtraction } from "@repo/types/organization/organization-profile.type";
