/**
 * Social Proof Schema & Type
 *
 * Defines social proof elements for organization profiles.
 *
 * @module @repo/types/organization/social-proof
 */

import { z } from "zod";

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

/** Social proof elements */
export type SocialProof = z.infer<typeof socialProofSchema>;
