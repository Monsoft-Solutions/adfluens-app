/**
 * Content Publish Result Table
 *
 * Stores the results of publishing content posts to specific platform accounts.
 * Each row represents one publish operation result for a content_post_account.
 *
 * This enables:
 * - Proper tracking of per-account publish results (no key collisions)
 * - Type-safe querying and filtering by platform, success status, dates
 * - Better analytics and debugging capabilities
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { contentPlatformEnum } from "./content-enums";
import { contentPostAccountTable } from "./content-post-account.table";

// =============================================================================
// Table Definition
// =============================================================================

export const contentPublishResultTable = pgTable(
  "content_publish_result",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the content post account junction */
    contentPostAccountId: uuid("content_post_account_id")
      .notNull()
      .references(() => contentPostAccountTable.id, { onDelete: "cascade" }),

    /** Platform (denormalized for easy querying) */
    platform: contentPlatformEnum("platform").notNull(),

    /** Account display name (denormalized for easy display) */
    accountName: text("account_name").notNull(),

    /** Whether publishing succeeded */
    success: boolean("success").notNull(),

    /** Platform-specific post ID */
    platformPostId: text("platform_post_id"),

    /** Permalink to the published post */
    permalink: text("permalink"),

    /** Error message if publishing failed */
    error: text("error"),

    /** When the post was published (null if failed) */
    publishedAt: timestamp("published_at"),

    /** When this record was created */
    createdAt: timestamp("created_at").defaultNow().notNull(),

    /** When this record was last updated */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // One result per content_post_account
    uniqueIndex("content_publish_result_account_uniq").on(
      table.contentPostAccountId
    ),
  ]
);

// =============================================================================
// Relations
// =============================================================================

export const contentPublishResultTableRelations = relations(
  contentPublishResultTable,
  ({ one }) => ({
    contentPostAccount: one(contentPostAccountTable, {
      fields: [contentPublishResultTable.contentPostAccountId],
      references: [contentPostAccountTable.id],
    }),
  })
);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for selecting a content publish result */
export type ContentPublishResultRow =
  typeof contentPublishResultTable.$inferSelect;

/** Type for inserting a new content publish result */
export type ContentPublishResultInsert =
  typeof contentPublishResultTable.$inferInsert;
