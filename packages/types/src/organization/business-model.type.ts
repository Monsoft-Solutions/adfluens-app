/**
 * Business Model Schema & Type
 *
 * Defines business model and monetization details for organization profiles.
 *
 * @module @repo/types/organization/business-model
 */

import { z } from "zod";

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

/** Business model information */
export type BusinessModel = z.infer<typeof businessModelSchema>;
