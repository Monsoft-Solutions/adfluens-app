import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";
import { metaPageTable } from "./meta-page.table";

/**
 * Custom response rules for specific keywords/intents
 */
export type MetaResponseRule = {
  id: string;
  name: string;
  triggers: string[];
  response: string;
  priority: number;
  isActive: boolean;
};

/**
 * AI personality/tone configuration
 */
export type MetaAiPersonality = {
  tone: "professional" | "friendly" | "casual" | "formal";
  responseLength: "concise" | "detailed" | "auto";
  useEmojis: boolean;
  customInstructions?: string;
};

/**
 * Sales assistant configuration
 */
export type MetaSalesConfig = {
  qualificationQuestions?: string[];
  autoHandoffOnQualified?: boolean;
  leadScoreThreshold?: number;
};

/**
 * Customer support configuration
 */
export type MetaSupportConfig = {
  maxAutoReplies?: number;
  escalationSentiment?: number;
};

/**
 * Business hours schedule
 */
export type MetaBusinessHours = {
  enabled: boolean;
  timezone: string;
  schedule: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;
};

/**
 * Meta Conversation Config table
 *
 * Stores AI bot configuration for each page.
 * Controls how the AI responds to messages, including personality,
 * business hours, custom rules, and handoff triggers.
 */
export const metaConversationConfigTable = pgTable(
  "meta_conversation_config",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page (unique - one config per page) */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .unique()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Whether AI responses are globally enabled */
    aiEnabled: boolean("ai_enabled").default(true).notNull(),

    /** AI personality/tone settings */
    aiPersonality: jsonb("ai_personality").$type<MetaAiPersonality>(),

    /** AI temperature (creativity) 0.0-1.0 */
    aiTemperature: numeric("ai_temperature", { precision: 3, scale: 2 })
      .default("0.70")
      .notNull(),

    /** Custom greeting message for new conversations */
    welcomeMessage: text("welcome_message"),

    /** Away message when outside business hours */
    awayMessage: text("away_message"),

    /** Business hours for auto-replies */
    businessHours: jsonb("business_hours").$type<MetaBusinessHours>(),

    /** Custom response rules */
    responseRules: jsonb("response_rules").$type<MetaResponseRule[]>(),

    /** Keywords that should trigger human handoff */
    handoffKeywords: text("handoff_keywords").array(),

    /** Email to notify on handoff request */
    handoffNotificationEmail: text("handoff_notification_email"),

    /** Whether to use organization profile data for AI context */
    useOrganizationContext: boolean("use_organization_context")
      .default(true)
      .notNull(),

    /** Whether to use scraped website data for AI context */
    useWebsiteContext: boolean("use_website_context").default(true).notNull(),

    /** Additional context/instructions for the AI */
    additionalContext: text("additional_context"),

    // =====================================================================
    // Bot Capabilities
    // =====================================================================

    /** Whether sales assistant mode is enabled */
    salesAssistantEnabled: boolean("sales_assistant_enabled")
      .default(false)
      .notNull(),

    /** Whether customer support mode is enabled */
    customerSupportEnabled: boolean("customer_support_enabled")
      .default(true)
      .notNull(),

    /** Whether appointment scheduling is enabled */
    appointmentSchedulingEnabled: boolean("appointment_scheduling_enabled")
      .default(false)
      .notNull(),

    /** Whether bot flows are enabled */
    flowsEnabled: boolean("flows_enabled").default(false).notNull(),

    /** Whether to fall back to AI when flows don't match */
    fallbackToAi: boolean("fallback_to_ai").default(true).notNull(),

    /** Sales assistant configuration */
    salesConfig: jsonb("sales_config").$type<MetaSalesConfig>(),

    /** Customer support configuration */
    supportConfig: jsonb("support_config").$type<MetaSupportConfig>(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_conversation_config_page_idx").on(table.metaPageId),
    index("meta_conversation_config_org_idx").on(table.organizationId),
  ]
);

/**
 * Meta conversation config relations
 */
export const metaConversationConfigTableRelations = relations(
  metaConversationConfigTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaConversationConfigTable.metaPageId],
      references: [metaPageTable.id],
    }),
  })
);

/** Type for inserting a new Meta conversation config */
export type MetaConversationConfigInsert =
  typeof metaConversationConfigTable.$inferInsert;

/** Type for selecting a Meta conversation config */
export type MetaConversationConfigRow =
  typeof metaConversationConfigTable.$inferSelect;
