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
import { botModeEnum, qualificationStatusEnum } from "./meta-enums";

/**
 * Sales qualification context
 */
export type MetaSalesContext = {
  qualificationStage?: "awareness" | "interest" | "consideration" | "decision";
  interestedProducts?: string[];
  budget?: string;
  timeline?: string;
  painPoints?: string[];
  decisionMakers?: string;
  competitorsConsidered?: string[];
};

/**
 * Appointment booking context
 */
export type MetaAppointmentContext = {
  service?: string;
  serviceId?: string;
  preferredDate?: string;
  preferredTime?: string;
  alternativeDates?: string[];
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
};

/**
 * User memory for cross-session context
 */
export type MetaUserMemory = {
  name?: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, string>;
  pastPurchases?: Array<{ product: string; date: string }>;
  pastIssues?: Array<{ issue: string; resolved: boolean; date: string }>;
  customData?: Record<string, unknown>;
  lastInteraction?: string;
};

/**
 * Detected language info
 */
export type MetaDetectedLanguage = {
  code: string;
  name: string;
  confidence: number;
  detectedAt: string;
};

/**
 * Full conversation context for AI and flow state
 */
export type MetaConversationContext = {
  /** Current flow being executed */
  currentFlowId?: string;
  currentNodeId?: string;

  /** Variables collected during flows */
  variables: Record<string, unknown>;

  /** Inputs collected via collect_input actions */
  collectedInputs: Record<string, string>;

  /** History of detected intents */
  intentHistory: string[];

  /** Sentiment tracking */
  sentimentHistory?: Array<{
    score: number;
    label: "positive" | "neutral" | "negative";
    timestamp: string;
  }>;

  /** Last AI response for context */
  lastAiResponse?: string;

  /** Last user message */
  lastUserMessage?: string;

  /** Reason for handoff if applicable */
  handoffReason?: string;

  /** Sales qualification context */
  salesContext?: MetaSalesContext;

  /** Appointment booking context */
  appointmentContext?: MetaAppointmentContext;

  /** Detected user language for auto-translation */
  detectedLanguage?: MetaDetectedLanguage;

  /** User memory for cross-session personalization */
  userMemory?: MetaUserMemory;
};

/**
 * Meta Conversation State table
 *
 * Tracks conversation context for multi-turn flows, sales qualification,
 * and appointment booking. One state per conversation.
 */
export const metaConversationStateTable = pgTable(
  "meta_conversation_state",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the conversation (unique - one state per conversation) */
    metaConversationId: uuid("meta_conversation_id")
      .notNull()
      .unique()
      .references(() => metaConversationTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Full context object */
    context: jsonb("context").$type<MetaConversationContext>().notNull(),

    /** Current bot mode */
    botMode: botModeEnum("bot_mode").notNull().default("ai"),

    /** Lead score (0-100) */
    leadScore: integer("lead_score").default(0),

    /** Qualification status */
    qualificationStatus: qualificationStatusEnum("qualification_status"),

    /** When bot last responded */
    lastBotResponseAt: timestamp("last_bot_response_at"),

    /** When user last messaged */
    lastUserMessageAt: timestamp("last_user_message_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_conv_state_org_idx").on(table.organizationId),
    index("meta_conv_state_mode_idx").on(table.botMode),
    index("meta_conv_state_qual_idx").on(table.qualificationStatus),
    // Index for sales sorting by lead score
    index("meta_conv_state_lead_score_idx").on(table.leadScore),
    // Index for activity queries
    index("meta_conv_state_last_activity_idx").on(table.lastBotResponseAt),
  ]
);

/**
 * Meta conversation state relations
 */
export const metaConversationStateTableRelations = relations(
  metaConversationStateTable,
  ({ one }) => ({
    metaConversation: one(metaConversationTable, {
      fields: [metaConversationStateTable.metaConversationId],
      references: [metaConversationTable.id],
    }),
  })
);

/** Type for inserting a new Meta conversation state */
export type MetaConversationStateInsert =
  typeof metaConversationStateTable.$inferInsert;

/** Type for selecting a Meta conversation state */
export type MetaConversationStateRow =
  typeof metaConversationStateTable.$inferSelect;
