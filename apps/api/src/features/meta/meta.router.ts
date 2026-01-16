/**
 * Meta tRPC Router
 *
 * API endpoints for Meta (Facebook/Instagram) integration.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  organizationProcedure,
} from "../../trpc/init";
import {
  generateMetaOAuthUrl,
  listAvailablePages,
  completeConnection,
  getConnection,
  getPages,
  getPage,
  disconnect,
  updatePage,
  syncPageLeads,
  syncPageConversations,
  getLeads,
  updateLeadStatus,
  getConversations,
  sendConversationMessage,
  getConversationConfig,
  updateConversationConfig,
} from "./meta.service";
import { syncFromMetaPages } from "../platform-connection/platform-connection.service";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./meta-notification.service";
import { testAiResponse } from "./meta-ai.utils";

// Define schemas inline to avoid import issues
const metaLeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

const metaPlatformSchema = z.enum(["messenger", "instagram"]);

const metaLeadListInputSchema = z.object({
  pageId: z.string().uuid().optional(),
  status: metaLeadStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

const metaConversationListInputSchema = z.object({
  pageId: z.string().uuid().optional(),
  platform: metaPlatformSchema.optional(),
  needsAttention: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

const metaSendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(2000),
});

export const metaRouter = router({
  // =========================================================================
  // Connection Management
  // =========================================================================

  /**
   * Get current Meta connection status
   */
  getConnection: organizationProcedure.query(async ({ ctx }) => {
    const connection = await getConnection(ctx.organization.id);
    const pages = connection ? await getPages(ctx.organization.id) : [];

    return {
      isConnected: !!connection && connection.status === "active",
      connection: connection
        ? {
            id: connection.id,
            metaUserName: connection.metaUserName,
            status: connection.status,
            lastError: connection.lastError,
            lastValidatedAt: connection.lastValidatedAt,
            createdAt: connection.createdAt,
          }
        : null,
      pages: pages.map((p) => ({
        id: p.id,
        pageId: p.pageId,
        pageName: p.pageName,
        messengerEnabled: p.messengerEnabled,
        instagramAccountId: p.instagramAccountId,
        instagramUsername: p.instagramUsername,
        instagramDmEnabled: p.instagramDmEnabled,
        status: p.status,
        pageData: p.pageData,
      })),
    };
  }),

  /**
   * Get OAuth URL for connecting Meta account
   */
  getOAuthUrl: organizationProcedure
    .input(z.object({ redirectPath: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const url = generateMetaOAuthUrl(
        ctx.organization.id,
        ctx.user.id,
        input?.redirectPath
      );
      return { url };
    }),

  /**
   * List available pages after OAuth (using setup code)
   */
  listAvailablePages: protectedProcedure
    .input(z.object({ setupCode: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pages = await listAvailablePages(input.setupCode, ctx.user.id);
      return { pages };
    }),

  /**
   * Complete connection by selecting pages
   */
  selectPages: organizationProcedure
    .input(
      z.object({
        setupCode: z.string().uuid(),
        pages: z.array(
          z.object({
            pageId: z.string(),
            pageName: z.string(),
            pageAccessToken: z.string(),
            instagramAccountId: z.string().optional(),
            instagramUsername: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connectionId = await completeConnection(
        input.setupCode,
        ctx.user.id,
        input.pages
      );

      // Sync platform connections for content creation
      await syncFromMetaPages(ctx.organization.id);

      return { connectionId };
    }),

  /**
   * Disconnect Meta integration
   */
  disconnect: organizationProcedure.mutation(async ({ ctx }) => {
    await disconnect(ctx.organization.id);
    return { success: true };
  }),

  /**
   * Update page settings (enable/disable Messenger, Instagram)
   */
  updatePage: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        messengerEnabled: z.boolean().optional(),
        instagramDmEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const page = await getPage(input.pageId, ctx.organization.id);
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }

      await updatePage(input.pageId, ctx.organization.id, {
        messengerEnabled: input.messengerEnabled,
        instagramDmEnabled: input.instagramDmEnabled,
      });

      return { success: true };
    }),

  /**
   * Sync historical leads from Meta for a page
   */
  syncLeads: organizationProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const page = await getPage(input.pageId, ctx.organization.id);
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }

      const result = await syncPageLeads(input.pageId, ctx.organization.id);
      return result;
    }),

  /**
   * Sync historical conversations from Meta for a page
   */
  syncConversations: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        platform: metaPlatformSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const page = await getPage(input.pageId, ctx.organization.id);
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }

      const result = await syncPageConversations(
        input.pageId,
        ctx.organization.id,
        input.platform || "messenger"
      );
      return result;
    }),

  // =========================================================================
  // Lead Management
  // =========================================================================

  /**
   * List leads for organization
   */
  listLeads: organizationProcedure
    .input(metaLeadListInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const leads = await getLeads(ctx.organization.id, {
        pageId: input?.pageId,
        status: input?.status,
        limit: input?.limit,
      });

      return { leads };
    }),

  /**
   * Get single lead details
   */
  getLead: organizationProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const leads = await getLeads(ctx.organization.id);
      const lead = leads.find((l) => l.id === input.leadId);

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      return { lead };
    }),

  /**
   * Update lead status
   */
  updateLeadStatus: organizationProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        status: metaLeadStatusSchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateLeadStatus(
        input.leadId,
        ctx.organization.id,
        input.status,
        input.notes
      );
      return { success: true };
    }),

  // =========================================================================
  // Conversation Management
  // =========================================================================

  /**
   * List conversations
   */
  listConversations: organizationProcedure
    .input(metaConversationListInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const conversations = await getConversations(ctx.organization.id, {
        pageId: input?.pageId,
        platform: input?.platform,
        needsAttention: input?.needsAttention,
        limit: input?.limit,
      });

      return { conversations };
    }),

  /**
   * Get single conversation with messages
   */
  getConversation: organizationProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversations = await getConversations(ctx.organization.id);
      const conversation = conversations.find(
        (c) => c.id === input.conversationId
      );

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return { conversation };
    }),

  /**
   * Send a message in a conversation
   */
  sendMessage: organizationProcedure
    .input(metaSendMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      await sendConversationMessage(
        input.conversationId,
        ctx.organization.id,
        input.text
      );
      return { success: true };
    }),

  /**
   * Toggle AI for a specific conversation
   */
  toggleConversationAi: organizationProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        aiEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // Implement in service
      return { success: true };
    }),

  // =========================================================================
  // AI Configuration
  // =========================================================================

  /**
   * Get AI config for a page
   */
  getConversationConfig: organizationProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const config = await getConversationConfig(
        input.pageId,
        ctx.organization.id
      );
      return { config };
    }),

  /**
   * Update AI config for a page
   */
  updateConversationConfig: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        config: z.object({
          aiEnabled: z.boolean().optional(),
          aiPersonality: z
            .object({
              tone: z.enum(["professional", "friendly", "casual", "formal"]),
              responseLength: z.enum(["concise", "detailed", "auto"]),
              useEmojis: z.boolean(),
              customInstructions: z.string().optional(),
            })
            .optional(),
          aiTemperature: z.number().min(0).max(1).optional(),
          welcomeMessage: z.string().optional(),
          awayMessage: z.string().optional(),
          businessHours: z
            .object({
              enabled: z.boolean(),
              timezone: z.string(),
              schedule: z.array(
                z.object({
                  day: z.number().min(0).max(6),
                  startTime: z.string(),
                  endTime: z.string(),
                })
              ),
            })
            .optional(),
          handoffKeywords: z.array(z.string()).optional(),
          handoffNotificationEmail: z.string().email().optional().nullable(),
          useOrganizationContext: z.boolean().optional(),
          useWebsiteContext: z.boolean().optional(),
          additionalContext: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert null to undefined for the service
      // Convert aiTemperature from number to string for database storage
      const config = {
        ...input.config,
        handoffNotificationEmail:
          input.config.handoffNotificationEmail ?? undefined,
        aiTemperature:
          input.config.aiTemperature !== undefined
            ? input.config.aiTemperature.toFixed(2)
            : undefined,
      };
      await updateConversationConfig(input.pageId, ctx.organization.id, config);
      return { success: true };
    }),

  /**
   * Test AI response generation
   */
  testAiResponse: organizationProcedure
    .input(
      z.object({
        testMessage: z.string().min(1),
        config: z
          .object({
            aiPersonality: z
              .object({
                tone: z.enum(["professional", "friendly", "casual", "formal"]),
                responseLength: z.enum(["concise", "detailed", "auto"]),
                useEmojis: z.boolean(),
                customInstructions: z.string().optional(),
              })
              .optional(),
            aiTemperature: z.number().min(0).max(1).optional(),
            useOrganizationContext: z.boolean().optional(),
            useWebsiteContext: z.boolean().optional(),
            additionalContext: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert aiTemperature from number to string for database types
      const config = input.config
        ? {
            ...input.config,
            aiTemperature:
              input.config.aiTemperature !== undefined
                ? input.config.aiTemperature.toFixed(2)
                : undefined,
          }
        : {};
      const response = await testAiResponse(
        ctx.organization.id,
        config,
        input.testMessage
      );
      return { response };
    }),

  // =========================================================================
  // Notifications
  // =========================================================================

  /**
   * Get notifications
   */
  listNotifications: organizationProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          unreadOnly: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const notifications = await getNotifications(ctx.organization.id, {
        limit: input?.limit,
        unreadOnly: input?.unreadOnly,
      });
      return { notifications };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: organizationProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationCount(ctx.organization.id);
    return { count };
  }),

  /**
   * Mark notification as read
   */
  markNotificationRead: organizationProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationAsRead(input.notificationId, ctx.organization.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllRead: organizationProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.organization.id);
    return { success: true };
  }),
});
