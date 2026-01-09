/**
 * Content Themes Schema & Type
 *
 * Defines content themes and topics for organization profiles.
 *
 * @module @repo/types/organization/content-themes
 */

import { z } from "zod";

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

/** Content themes and topics */
export type ContentThemes = z.infer<typeof contentThemesSchema>;
