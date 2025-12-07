/**
 * Target Audience Schema & Type
 *
 * Defines target audience details for organization profiles.
 *
 * @module @repo/types/organization/target-audience
 */

import { z } from "zod";

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

/** Target audience details for content tailoring */
export type TargetAudienceDetails = z.infer<typeof targetAudienceSchema>;
