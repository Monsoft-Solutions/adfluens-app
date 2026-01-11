import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { metaConversationTable } from "./meta-conversation.table";
import { metaBotFlowTable } from "./meta-bot-flow.table";
import { metaPageTable } from "./meta-page.table";
import type { MetaConversationContext } from "./meta-conversation-state.table";
import { scheduledExecutionStatusEnum } from "./meta-enums";

/**
 * Meta Flow Scheduled Execution table
 *
 * Stores scheduled flow node executions for delay/wait functionality.
 * When a delay node is encountered, the next node execution is stored here
 * and picked up by a background processor when the delay expires.
 */
export const metaFlowScheduledExecutionTable = pgTable(
  "meta_flow_scheduled_execution",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Organization ID for quick lookups */
    organizationId: text("organization_id").notNull(),

    /** Reference to the Meta page */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Reference to the conversation */
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => metaConversationTable.id, { onDelete: "cascade" }),

    /** Reference to the flow being executed */
    flowId: uuid("flow_id")
      .notNull()
      .references(() => metaBotFlowTable.id, { onDelete: "cascade" }),

    /** The node ID to execute after the delay */
    nextNodeId: text("next_node_id").notNull(),

    /** When the node should be executed */
    scheduledFor: timestamp("scheduled_for").notNull(),

    /** Conversation context snapshot (needed to resume flow) */
    conversationContext: jsonb(
      "conversation_context"
    ).$type<MetaConversationContext>(),

    /** Execution status */
    status: scheduledExecutionStatusEnum("status").default("pending").notNull(),

    /** Number of execution attempts */
    attempts: integer("attempts").default(0).notNull(),

    /** Last error message if failed */
    lastError: text("last_error"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),

    /** When the execution was processed */
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    // Index for finding due executions efficiently
    index("meta_sched_exec_due_idx").on(table.status, table.scheduledFor),
    // Index for finding executions by conversation (for cancellation)
    index("meta_sched_exec_conv_idx").on(table.conversationId),
    // Index for finding executions by flow (for deactivation)
    index("meta_sched_exec_flow_idx").on(table.flowId),
    // Index for org lookups
    index("meta_sched_exec_org_idx").on(table.organizationId),
  ]
);

/**
 * Meta flow scheduled execution relations
 */
export const metaFlowScheduledExecutionTableRelations = relations(
  metaFlowScheduledExecutionTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaFlowScheduledExecutionTable.metaPageId],
      references: [metaPageTable.id],
    }),
    conversation: one(metaConversationTable, {
      fields: [metaFlowScheduledExecutionTable.conversationId],
      references: [metaConversationTable.id],
    }),
    flow: one(metaBotFlowTable, {
      fields: [metaFlowScheduledExecutionTable.flowId],
      references: [metaBotFlowTable.id],
    }),
  })
);

/** Type for inserting a new scheduled execution */
export type MetaFlowScheduledExecutionInsert =
  typeof metaFlowScheduledExecutionTable.$inferInsert;

/** Type for selecting a scheduled execution */
export type MetaFlowScheduledExecutionRow =
  typeof metaFlowScheduledExecutionTable.$inferSelect;
