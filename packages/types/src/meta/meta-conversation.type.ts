/**
 * Meta Conversation Type
 *
 * Represents a Messenger or Instagram DM conversation.
 *
 * @module @repo/types/meta/meta-conversation
 */

import { z } from "zod";

/**
 * Platform schema
 */
export const metaPlatformSchema = z.enum(["messenger", "instagram"]);

export type MetaPlatform = z.infer<typeof metaPlatformSchema>;

/**
 * Message attachment schema
 */
export const metaMessageAttachmentSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
});

export type MetaMessageAttachment = z.infer<typeof metaMessageAttachmentSchema>;

/**
 * Individual message schema
 */
export const metaMessageSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  senderId: z.string(),
  senderName: z.string().optional(),
  isFromPage: z.boolean(),
  text: z.string().optional(),
  attachments: z.array(metaMessageAttachmentSchema).optional(),
  isAiGenerated: z.boolean().optional(),
});

export type MetaMessage = z.infer<typeof metaMessageSchema>;

/**
 * Meta conversation schema
 */
export const metaConversationSchema = z.object({
  /** Unique identifier */
  id: z.string(),

  /** Meta page ID this conversation belongs to */
  metaPageId: z.string(),

  /** Organization ID (denormalized) */
  organizationId: z.string(),

  /** Platform: messenger or instagram */
  platform: metaPlatformSchema,

  /** Meta's thread/conversation ID */
  threadId: z.string(),

  /** Participant's user ID */
  participantId: z.string(),

  /** Participant's name */
  participantName: z.string().nullable(),

  /** Participant's profile picture URL */
  participantProfilePic: z.string().nullable(),

  /** Last message preview */
  lastMessagePreview: z.string().nullable(),

  /** Last message timestamp */
  lastMessageAt: z.date().nullable(),

  /** Whether AI auto-reply is enabled */
  aiEnabled: z.boolean(),

  /** Whether marked as spam */
  isSpam: z.boolean(),

  /** Whether archived */
  isArchived: z.boolean(),

  /** Whether needs human attention */
  needsAttention: z.boolean(),

  /** Recent messages (last 10) */
  recentMessages: z.array(metaMessageSchema).nullable(),

  /** Total message count */
  messageCount: z.number(),

  /** When conversation was created */
  createdAt: z.date(),
});

export type MetaConversation = z.infer<typeof metaConversationSchema>;

/**
 * Input schema for sending a message
 */
export const metaSendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(2000),
});

export type MetaSendMessageInput = z.infer<typeof metaSendMessageInputSchema>;

/**
 * Conversation list query params
 */
export const metaConversationListInputSchema = z.object({
  pageId: z.string().uuid().optional(),
  platform: metaPlatformSchema.optional(),
  needsAttention: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type MetaConversationListInput = z.infer<
  typeof metaConversationListInputSchema
>;
