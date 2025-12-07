/**
 * Brand Voice Schema & Type
 *
 * Defines brand voice and tone characteristics for organization profiles.
 *
 * @module @repo/types/organization/brand-voice
 */

import { z } from "zod";

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

/** Brand voice and tone characteristics */
export type BrandVoice = z.infer<typeof brandVoiceSchema>;
