import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { metaPageTable } from "./meta-page.table";

/**
 * Trigger configuration for when a flow should activate
 */
export type MetaBotFlowTrigger = {
  type: "keyword" | "intent" | "regex" | "event";
  value: string;
  matchMode?: "exact" | "contains" | "starts_with" | "ends_with";
  caseSensitive?: boolean;
};

/**
 * Action to perform in a flow node
 */
export type MetaBotFlowAction = {
  type:
    | "send_message"
    | "send_quick_replies"
    | "collect_input"
    | "set_variable"
    | "handoff"
    | "goto_node"
    | "ai_response"
    | "delay"
    | "http_request";
  config: Record<string, unknown>;
};

/**
 * A node in the bot flow
 */
export type MetaBotFlowNode = {
  id: string;
  name: string;
  type: "entry" | "message" | "condition" | "action" | "ai_node" | "exit";
  triggers?: MetaBotFlowTrigger[];
  actions: MetaBotFlowAction[];
  nextNodes?: string[];
  conditions?: Array<{
    expression: string;
    targetNodeId: string;
  }>;
};

/**
 * Meta Bot Flow table
 *
 * Stores bot conversation flows for manual overrides and automations.
 * Flows are checked before AI responses and can intercept specific keywords/intents.
 */
export const metaBotFlowTable = pgTable(
  "meta_bot_flow",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Flow name */
    name: text("name").notNull(),

    /** Flow description */
    description: text("description"),

    /** Flow type: override (interrupts AI), automation (triggered events) */
    flowType: text("flow_type").notNull(),

    /** Flow nodes (the conversation tree) */
    nodes: jsonb("nodes").$type<MetaBotFlowNode[]>().notNull(),

    /** Entry node ID */
    entryNodeId: text("entry_node_id").notNull(),

    /** Global triggers that activate this flow */
    globalTriggers: jsonb("global_triggers").$type<MetaBotFlowTrigger[]>(),

    /** Priority (higher = checked first) */
    priority: integer("priority").default(0).notNull(),

    /** Whether flow is active */
    isActive: boolean("is_active").default(true).notNull(),

    /** Analytics: how many times triggered */
    triggerCount: integer("trigger_count").default(0).notNull(),

    /** Analytics: how many times completed */
    completionCount: integer("completion_count").default(0).notNull(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_bot_flow_page_idx").on(table.metaPageId),
    index("meta_bot_flow_org_idx").on(table.organizationId),
    index("meta_bot_flow_type_idx").on(table.flowType),
    index("meta_bot_flow_priority_idx").on(table.priority),
    index("meta_bot_flow_active_idx").on(table.isActive),
  ]
);

/**
 * Meta bot flow relations
 */
export const metaBotFlowTableRelations = relations(
  metaBotFlowTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaBotFlowTable.metaPageId],
      references: [metaPageTable.id],
    }),
  })
);

/** Type for inserting a new Meta bot flow */
export type MetaBotFlowInsert = typeof metaBotFlowTable.$inferInsert;

/** Type for selecting a Meta bot flow */
export type MetaBotFlowRow = typeof metaBotFlowTable.$inferSelect;
