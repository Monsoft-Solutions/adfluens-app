/**
 * Meta Webhook Types
 *
 * Represents webhook payloads from Meta for messages and leads.
 *
 * @module @repo/types/meta/meta-webhook
 */

import { z } from "zod";

/**
 * Messenger message event schema
 */
export const messengerMessageEventSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
  message: z
    .object({
      mid: z.string(),
      text: z.string().optional(),
      attachments: z
        .array(
          z.object({
            type: z.string(),
            payload: z.object({ url: z.string().optional() }).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  postback: z
    .object({
      title: z.string(),
      payload: z.string(),
    })
    .optional(),
});

export type MessengerMessageEvent = z.infer<typeof messengerMessageEventSchema>;

/**
 * Instagram message event schema
 */
export const instagramMessageEventSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
  message: z.object({
    mid: z.string(),
    text: z.string().optional(),
    attachments: z
      .array(
        z.object({
          type: z.string(),
          payload: z.any().optional(),
        })
      )
      .optional(),
  }),
});

export type InstagramMessageEvent = z.infer<typeof instagramMessageEventSchema>;

/**
 * Lead generation webhook value schema
 */
export const leadgenWebhookValueSchema = z.object({
  leadgen_id: z.string(),
  page_id: z.string(),
  form_id: z.string(),
  ad_id: z.string().optional(),
  adgroup_id: z.string().optional(),
  created_time: z.number(),
});

export type LeadgenWebhookValue = z.infer<typeof leadgenWebhookValueSchema>;

/**
 * Lead generation webhook change schema
 */
export const leadgenWebhookChangeSchema = z.object({
  field: z.literal("leadgen"),
  value: leadgenWebhookValueSchema,
});

export type LeadgenWebhookChange = z.infer<typeof leadgenWebhookChangeSchema>;

/**
 * Page webhook entry schema
 */
export const pageWebhookEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.array(messengerMessageEventSchema).optional(),
  changes: z.array(leadgenWebhookChangeSchema).optional(),
});

export type PageWebhookEntry = z.infer<typeof pageWebhookEntrySchema>;

/**
 * Instagram webhook entry schema
 */
export const instagramWebhookEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.array(instagramMessageEventSchema).optional(),
});

export type InstagramWebhookEntry = z.infer<typeof instagramWebhookEntrySchema>;

/**
 * Full webhook body schema for page events
 */
export const pageWebhookBodySchema = z.object({
  object: z.literal("page"),
  entry: z.array(pageWebhookEntrySchema),
});

export type PageWebhookBody = z.infer<typeof pageWebhookBodySchema>;

/**
 * Full webhook body schema for Instagram events
 */
export const instagramWebhookBodySchema = z.object({
  object: z.literal("instagram"),
  entry: z.array(instagramWebhookEntrySchema),
});

export type InstagramWebhookBody = z.infer<typeof instagramWebhookBodySchema>;

/**
 * Lead data fetched from Graph API
 */
export const metaLeadDataSchema = z.object({
  id: z.string(),
  created_time: z.string(),
  form_id: z.string(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  field_data: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.string()),
    })
  ),
});

export type MetaLeadData = z.infer<typeof metaLeadDataSchema>;

/**
 * Lead form schema from Graph API
 */
export const metaLeadFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
  page_id: z.string().optional(),
});

export type MetaLeadForm = z.infer<typeof metaLeadFormSchema>;
