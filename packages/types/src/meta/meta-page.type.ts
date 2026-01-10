/**
 * Meta Page Type
 *
 * Represents a Facebook Page and optionally linked Instagram Business account.
 *
 * @module @repo/types/meta/meta-page
 */

import { z } from "zod";

/**
 * Page data cached from Meta API
 */
export const metaPageDataSchema = z.object({
  category: z.string().optional(),
  categoryList: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional(),
  about: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  emails: z.array(z.string()).optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      street: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  coverPhoto: z.string().optional(),
  profilePicture: z.string().optional(),
  followersCount: z.number().optional(),
  fanCount: z.number().optional(),
});

export type MetaPageData = z.infer<typeof metaPageDataSchema>;

/**
 * Meta page status schema
 */
export const metaPageStatusSchema = z.enum(["active", "disconnected", "error"]);

export type MetaPageStatus = z.infer<typeof metaPageStatusSchema>;

/**
 * Meta page schema
 */
export const metaPageSchema = z.object({
  /** Unique identifier */
  id: z.string(),

  /** Meta connection ID this page belongs to */
  metaConnectionId: z.string(),

  /** Organization ID (denormalized) */
  organizationId: z.string(),

  /** Facebook Page ID */
  pageId: z.string(),

  /** Facebook Page name */
  pageName: z.string(),

  /** Whether Messenger auto-reply is enabled */
  messengerEnabled: z.boolean(),

  /** Linked Instagram Business Account ID */
  instagramAccountId: z.string().nullable(),

  /** Instagram username */
  instagramUsername: z.string().nullable(),

  /** Whether Instagram DM auto-reply is enabled */
  instagramDmEnabled: z.boolean(),

  /** Cached page data from Meta API */
  pageData: metaPageDataSchema.nullable(),

  /** Whether webhooks are subscribed */
  webhookSubscribed: z.boolean(),

  /** Page status */
  status: metaPageStatusSchema,

  /** Last error message */
  lastError: z.string().nullable(),

  /** When page data was last synced */
  lastSyncedAt: z.date().nullable(),

  /** When the page was connected */
  createdAt: z.date(),
});

export type MetaPage = z.infer<typeof metaPageSchema>;

/**
 * Input schema for selecting a page during setup
 */
export const metaPageSelectInputSchema = z.object({
  setupCode: z.string().uuid(),
  pageId: z.string(),
  pageName: z.string(),
  pageAccessToken: z.string(),
  instagramAccountId: z.string().optional(),
  instagramUsername: z.string().optional(),
});

export type MetaPageSelectInput = z.infer<typeof metaPageSelectInputSchema>;

/**
 * Available page from Meta API during setup
 */
export const metaAvailablePageSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  accessToken: z.string(),
  instagramBusinessAccount: z
    .object({
      id: z.string(),
      username: z.string().optional(),
    })
    .optional(),
});

export type MetaAvailablePage = z.infer<typeof metaAvailablePageSchema>;
