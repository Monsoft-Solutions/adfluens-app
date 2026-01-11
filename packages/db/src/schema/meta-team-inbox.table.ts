import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { metaConversationTable } from "./meta-conversation.table";
import { inboxPriorityEnum, inboxStatusEnum } from "./meta-enums";

/**
 * Meta Team Inbox table
 *
 * Manages human handoff queue with assignment, priority, and status tracking.
 * When a conversation is escalated, an inbox item is created for team members.
 */
export const metaTeamInboxTable = pgTable(
  "meta_team_inbox",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the conversation */
    metaConversationId: uuid("meta_conversation_id")
      .notNull()
      .references(() => metaConversationTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** User ID this conversation is assigned to (null = unassigned) */
    assignedToUserId: text("assigned_to_user_id"),

    /** When the conversation was assigned */
    assignedAt: timestamp("assigned_at"),

    /** Priority level */
    priority: inboxPriorityEnum("priority").notNull().default("normal"),

    /** Status of the inbox item */
    status: inboxStatusEnum("status").notNull().default("open"),

    /** Reason for handoff (e.g., "keyword: refund", "sentiment: negative") */
    handoffReason: text("handoff_reason"),

    /** What triggered the handoff */
    handoffTriggeredBy: text("handoff_triggered_by"),

    /** When team first responded */
    firstResponseAt: timestamp("first_response_at"),

    /** When the issue was resolved */
    resolvedAt: timestamp("resolved_at"),

    /** Internal notes (not visible to customer) */
    internalNotes: text("internal_notes"),

    /** Tags for categorization */
    tags: text("tags").array(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_inbox_conv_idx").on(table.metaConversationId),
    index("meta_inbox_org_idx").on(table.organizationId),
    index("meta_inbox_assigned_idx").on(table.assignedToUserId),
    index("meta_inbox_status_idx").on(table.status),
    index("meta_inbox_priority_idx").on(table.priority),
    index("meta_inbox_created_idx").on(table.createdAt),
    // Composite indexes for common query patterns
    index("meta_inbox_org_status_idx").on(table.organizationId, table.status),
    index("meta_inbox_assignee_status_idx").on(
      table.assignedToUserId,
      table.status
    ),
  ]
);

/**
 * Meta team inbox relations
 */
export const metaTeamInboxTableRelations = relations(
  metaTeamInboxTable,
  ({ one }) => ({
    metaConversation: one(metaConversationTable, {
      fields: [metaTeamInboxTable.metaConversationId],
      references: [metaConversationTable.id],
    }),
  })
);

/** Type for inserting a new Meta team inbox item */
export type MetaTeamInboxInsert = typeof metaTeamInboxTable.$inferInsert;

/** Type for selecting a Meta team inbox item */
export type MetaTeamInboxRow = typeof metaTeamInboxTable.$inferSelect;
