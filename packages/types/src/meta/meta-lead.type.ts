/**
 * Meta Lead Type
 *
 * Represents a lead captured from Meta Lead Generation Ads.
 *
 * @module @repo/types/meta/meta-lead
 */

import { z } from "zod";

/**
 * Lead field data from form submission
 */
export const metaLeadFieldDataSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
});

export type MetaLeadFieldData = z.infer<typeof metaLeadFieldDataSchema>;

/**
 * Lead status schema
 */
export const metaLeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

export type MetaLeadStatus = z.infer<typeof metaLeadStatusSchema>;

/**
 * Meta lead schema
 */
export const metaLeadSchema = z.object({
  /** Unique identifier */
  id: z.string(),

  /** Meta page ID this lead belongs to */
  metaPageId: z.string(),

  /** Organization ID (denormalized) */
  organizationId: z.string(),

  /** Meta's lead ID */
  leadId: z.string(),

  /** Form ID the lead came from */
  formId: z.string(),

  /** Form name for display */
  formName: z.string().nullable(),

  /** Ad ID that generated the lead */
  adId: z.string().nullable(),

  /** Ad name for display */
  adName: z.string().nullable(),

  /** Campaign ID */
  campaignId: z.string().nullable(),

  /** Campaign name */
  campaignName: z.string().nullable(),

  /** When the lead was created on Meta */
  leadCreatedAt: z.date(),

  /** Extracted full name */
  fullName: z.string().nullable(),

  /** Extracted email */
  email: z.string().nullable(),

  /** Extracted phone number */
  phone: z.string().nullable(),

  /** Raw field data from form */
  fieldData: z.array(metaLeadFieldDataSchema).nullable(),

  /** Processing status */
  status: metaLeadStatusSchema,

  /** Notes added by user */
  notes: z.string().nullable(),

  /** Whether notifications were sent */
  notificationsSent: z.boolean(),

  /** When the lead was captured */
  createdAt: z.date(),
});

export type MetaLead = z.infer<typeof metaLeadSchema>;

/**
 * Input schema for updating lead status
 */
export const metaLeadUpdateInputSchema = z.object({
  leadId: z.string().uuid(),
  status: metaLeadStatusSchema.optional(),
  notes: z.string().optional(),
});

export type MetaLeadUpdateInput = z.infer<typeof metaLeadUpdateInputSchema>;

/**
 * Lead list query params
 */
export const metaLeadListInputSchema = z.object({
  pageId: z.string().uuid().optional(),
  status: metaLeadStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type MetaLeadListInput = z.infer<typeof metaLeadListInputSchema>;
