/**
 * Content Post Account Junction Table
 *
 * Links content posts to specific platform accounts.
 * Each row represents the relationship between a post and a target account,
 * with its own publish status and result.
 *
 * This enables:
 * - Publishing a single post to multiple accounts
 * - Per-account publish status tracking
 * - Per-account publish results (postId, permalink, errors)
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contentPostStatusEnum } from "./content-enums";
import {
  contentPostTable,
  type ContentPostPublishResultJson,
} from "./content-post.table";
import { platformConnectionTable } from "./platform-connection.table";

// =============================================================================
// Table Definition
// =============================================================================

export const contentPostAccountTable = pgTable(
  "content_post_account",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the content post */
    contentPostId: uuid("content_post_id")
      .notNull()
      .references(() => contentPostTable.id, { onDelete: "cascade" }),

    /** Reference to the target platform connection */
    platformConnectionId: uuid("platform_connection_id")
      .notNull()
      .references(() => platformConnectionTable.id, { onDelete: "cascade" }),

    /**
     * Per-account publish status
     * - pending: Waiting to be published
     * - published: Successfully published to this account
     * - failed: Publishing failed for this account
     */
    status: contentPostStatusEnum("status").notNull().default("pending"),

    /** Publishing result for this specific account */
    publishResult:
      jsonb("publish_result").$type<ContentPostPublishResultJson>(),

    /** When this record was created */
    createdAt: timestamp("created_at").defaultNow().notNull(),

    /** When this record was last updated */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("content_post_account_post_idx").on(table.contentPostId),
    index("content_post_account_connection_idx").on(table.platformConnectionId),
    index("content_post_account_status_idx").on(table.status),
    // Ensure a post can only be linked to an account once
    uniqueIndex("content_post_account_post_connection_uniq").on(
      table.contentPostId,
      table.platformConnectionId
    ),
  ]
);

// =============================================================================
// Relations
// =============================================================================

export const contentPostAccountTableRelations = relations(
  contentPostAccountTable,
  ({ one }) => ({
    /** The content post this belongs to */
    contentPost: one(contentPostTable, {
      fields: [contentPostAccountTable.contentPostId],
      references: [contentPostTable.id],
    }),
    /** The target platform connection */
    platformConnection: one(platformConnectionTable, {
      fields: [contentPostAccountTable.platformConnectionId],
      references: [platformConnectionTable.id],
    }),
  })
);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for inserting a new content post account */
export type ContentPostAccountInsert =
  typeof contentPostAccountTable.$inferInsert;

/** Type for selecting a content post account */
export type ContentPostAccountRow = typeof contentPostAccountTable.$inferSelect;
