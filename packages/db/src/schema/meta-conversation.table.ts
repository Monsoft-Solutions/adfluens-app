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
 * Individual message in a conversation
 */
export type MetaMessage = {
  id: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  isFromPage: boolean;
  text?: string;
  attachments?: Array<{
    type: string;
    url?: string;
  }>;
  isAiGenerated?: boolean;
};

/**
 * Meta Conversation table
 *
 * Tracks Messenger and Instagram DM conversations.
 * Stores conversation metadata and recent messages for AI context.
 */
export const metaConversationTable = pgTable(
  "meta_conversation",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Platform: messenger or instagram */
    platform: text("platform").notNull(),

    /** Meta's thread/conversation ID */
    threadId: text("thread_id").notNull(),

    /** Participant's user ID (PSID for Messenger, IGSID for Instagram) */
    participantId: text("participant_id").notNull(),

    /** Participant's name (if available) */
    participantName: text("participant_name"),

    /** Participant's profile picture URL */
    participantProfilePic: text("participant_profile_pic"),

    /** Last message preview */
    lastMessagePreview: text("last_message_preview"),

    /** Last message timestamp */
    lastMessageAt: timestamp("last_message_at"),

    /** Whether AI auto-reply is enabled for this conversation */
    aiEnabled: boolean("ai_enabled").default(true).notNull(),

    /** Whether conversation is marked as spam */
    isSpam: boolean("is_spam").default(false).notNull(),

    /** Whether conversation is archived */
    isArchived: boolean("is_archived").default(false).notNull(),

    /** Whether conversation needs human attention (handoff requested) */
    needsAttention: boolean("needs_attention").default(false).notNull(),

    /** Cached recent messages (last 10 for context) */
    recentMessages: jsonb("recent_messages").$type<MetaMessage[]>(),

    /** Total message count */
    messageCount: integer("message_count").default(0).notNull(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_conversation_page_idx").on(table.metaPageId),
    index("meta_conversation_org_idx").on(table.organizationId),
    index("meta_conversation_thread_idx").on(table.threadId),
    index("meta_conversation_platform_idx").on(table.platform),
    index("meta_conversation_last_msg_idx").on(table.lastMessageAt),
    index("meta_conversation_attention_idx").on(table.needsAttention),
  ]
);

/**
 * Meta conversation relations
 */
export const metaConversationTableRelations = relations(
  metaConversationTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaConversationTable.metaPageId],
      references: [metaPageTable.id],
    }),
  })
);

/** Type for inserting a new Meta conversation */
export type MetaConversationInsert = typeof metaConversationTable.$inferInsert;

/** Type for selecting a Meta conversation */
export type MetaConversationRow = typeof metaConversationTable.$inferSelect;
