/**
 * Extract Organization Profile Function
 *
 * AI-powered extraction of comprehensive business information from website content.
 * Uses structured output to ensure consistent, typed results.
 *
 * @module @repo/ai/functions/extract-organization-profile
 */

import {
  organizationProfileSchema,
  type OrganizationProfile,
} from "@repo/types/organization/organization-profile.type";

import { coreGenerateObject } from "../core";
import { DEFAULT_DATA_EXTRACTION_MODEL_ID } from "../models";
import {
  ORGANIZATION_EXTRACTION_SYSTEM_PROMPT,
  getOrganizationExtractionPrompt,
} from "../prompts/organization/organization-extraction.prompt";

/** Maximum content length to process (prevents exceeding context limits) */
const MAX_CONTENT_LENGTH = 100000;

/** Minimum content length required for meaningful extraction */
const MIN_CONTENT_LENGTH = 100;

/** Default result returned when extraction fails or input is insufficient */
const DEFAULT_RESULT: OrganizationProfile = {};

/**
 * Options for organization profile extraction
 */
export type ExtractOrganizationProfileOptions = {
  /** Override the default model ID */
  modelId?: string;
  /** Override the default temperature (default: 0.3) */
  temperature?: number;
};

/**
 * Extract comprehensive organization profile from website content using AI.
 *
 * Analyzes markdown content from a scraped website and extracts structured
 * business information including core details, brand voice, target audience,
 * competitive positioning, content themes, business model, and social proof.
 *
 * @param websiteContent - Markdown content from the scraped website
 * @param options - Optional configuration for extraction
 * @returns Extracted organization profile data
 *
 * @example
 * ```typescript
 * const profile = await extractOrganizationProfile(markdownContent);
 * console.log(profile.businessName);
 * console.log(profile.brandVoice?.tone);
 * ```
 */
export async function extractOrganizationProfile(
  websiteContent: string,
  options: ExtractOrganizationProfileOptions = {}
): Promise<OrganizationProfile> {
  // Input validation - require minimum content for meaningful extraction
  if (!websiteContent || websiteContent.trim().length < MIN_CONTENT_LENGTH) {
    return DEFAULT_RESULT;
  }

  const { modelId = DEFAULT_DATA_EXTRACTION_MODEL_ID, temperature = 0.3 } =
    options;

  // Truncate content if too long (keep first portion to stay within context limits)
  const truncatedContent =
    websiteContent.length > MAX_CONTENT_LENGTH
      ? websiteContent.slice(0, MAX_CONTENT_LENGTH) +
        "\n\n[Content truncated for processing...]"
      : websiteContent;

  try {
    const result = await coreGenerateObject({
      schema: organizationProfileSchema,
      system: ORGANIZATION_EXTRACTION_SYSTEM_PROMPT,
      prompt: getOrganizationExtractionPrompt(truncatedContent),
      modelId,
      temperature,
    });

    return result.object;
  } catch (error) {
    console.error("[ExtractOrganizationProfile] Error:", error);
    return DEFAULT_RESULT;
  }
}
