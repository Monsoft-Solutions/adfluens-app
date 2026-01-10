import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { metaConnectionTable } from "./meta-connection.table";

/**
 * Page-specific data cached from Meta API
 */
export type MetaPageData = {
  category?: string;
  categoryList?: Array<{ id: string; name: string }>;
  about?: string;
  description?: string;
  website?: string;
  phone?: string;
  emails?: string[];
  location?: {
    city?: string;
    country?: string;
    street?: string;
    zip?: string;
  };
  coverPhoto?: string;
  profilePicture?: string;
  followersCount?: number;
  fanCount?: number;
};

/**
 * Meta Page table
 *
 * Stores Facebook Pages and their linked Instagram Business accounts.
 * Each organization can have multiple pages connected.
 * Page access tokens are used for page-specific API calls.
 */
export const metaPageTable = pgTable(
  "meta_page",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta connection */
    metaConnectionId: uuid("meta_connection_id")
      .notNull()
      .references(() => metaConnectionTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Facebook Page ID */
    pageId: text("page_id").notNull(),

    /** Facebook Page name */
    pageName: text("page_name").notNull(),

    /** Page-specific access token (never expires for long-lived tokens) */
    pageAccessToken: text("page_access_token").notNull(),

    /** Whether Messenger auto-reply is enabled for this page */
    messengerEnabled: boolean("messenger_enabled").default(false).notNull(),

    /** Linked Instagram Business Account ID (if any) */
    instagramAccountId: text("instagram_account_id"),

    /** Instagram username (if linked) */
    instagramUsername: text("instagram_username"),

    /** Whether Instagram DM auto-reply is enabled */
    instagramDmEnabled: boolean("instagram_dm_enabled")
      .default(false)
      .notNull(),

    /** Cached page data from Meta API */
    pageData: jsonb("page_data").$type<MetaPageData>(),

    /** Whether this page is subscribed to webhooks */
    webhookSubscribed: boolean("webhook_subscribed").default(false).notNull(),

    /** Page status: active, disconnected, or error */
    status: text("status").notNull().default("active"),

    /** Last error if status is error */
    lastError: text("last_error"),

    /** When page data was last synced */
    lastSyncedAt: timestamp("last_synced_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_page_connection_idx").on(table.metaConnectionId),
    index("meta_page_org_idx").on(table.organizationId),
    index("meta_page_page_id_idx").on(table.pageId),
    index("meta_page_instagram_id_idx").on(table.instagramAccountId),
    index("meta_page_status_idx").on(table.status),
  ]
);

/**
 * Meta page relations
 */
export const metaPageTableRelations = relations(metaPageTable, ({ one }) => ({
  metaConnection: one(metaConnectionTable, {
    fields: [metaPageTable.metaConnectionId],
    references: [metaConnectionTable.id],
  }),
}));

/** Type for inserting a new Meta page */
export type MetaPageInsert = typeof metaPageTable.$inferInsert;

/** Type for selecting a Meta page */
export type MetaPageRow = typeof metaPageTable.$inferSelect;
