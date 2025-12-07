/**
 * Competitive Positioning Schema & Type
 *
 * Defines competitive positioning information for organization profiles.
 *
 * @module @repo/types/organization/competitive-positioning
 */

import { z } from "zod";

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

/** Competitive positioning information */
export type CompetitivePositioning = z.infer<
  typeof competitivePositioningSchema
>;
