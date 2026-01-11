/**
 * Meta Bot tRPC Router
 *
 * API endpoints for Meta bot management, inbox, flows, and appointments.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, organizationProcedure } from "../../trpc/init";
import {
  db,
  eq,
  and,
  desc,
  metaConversationConfigTable,
  metaTeamInboxTable,
  metaBotFlowTable,
  metaAppointmentConfigTable,
  metaAppointmentTable,
} from "@repo/db";
import type { MetaBotFlowNode } from "@repo/db";
import {
  getConversationConfig,
  createDefaultConversationConfig,
  returnToBotMode,
} from "./meta-bot.service";
import { testAiResponse } from "./meta-bot-ai.service";

// =============================================================================
// Schemas
// =============================================================================

const aiPersonalitySchema = z.object({
  tone: z.enum(["professional", "friendly", "casual", "formal"]),
  responseLength: z.enum(["concise", "detailed", "auto"]),
  useEmojis: z.boolean(),
  customInstructions: z.string().optional(),
});

const businessHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string(),
  schedule: z.array(
    z.object({
      day: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
});

const responseRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  triggers: z.array(z.string()),
  response: z.string(),
  priority: z.number(),
  isActive: z.boolean(),
});

const salesConfigSchema = z.object({
  qualificationQuestions: z.array(z.string()).optional(),
  autoHandoffOnQualified: z.boolean().optional(),
  leadScoreThreshold: z.number().optional(),
});

const supportConfigSchema = z.object({
  maxAutoReplies: z.number().optional(),
  escalationSentiment: z.number().min(0).max(1).optional(),
});

const flowTriggerSchema = z.object({
  type: z.enum(["keyword", "intent", "regex", "event"]),
  value: z.string(),
  matchMode: z
    .enum(["exact", "contains", "starts_with", "ends_with"])
    .optional(),
  caseSensitive: z.boolean().optional(),
});

const flowActionSchema = z.object({
  type: z.enum([
    "send_message",
    "send_quick_replies",
    "collect_input",
    "set_variable",
    "handoff",
    "goto_node",
    "ai_response",
    "delay",
    "http_request",
  ]),
  config: z.record(z.string(), z.unknown()),
});

const flowNodeSchema: z.ZodType<MetaBotFlowNode> = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["entry", "message", "condition", "action", "ai_node", "exit"]),
  triggers: z.array(flowTriggerSchema).optional(),
  actions: z.array(flowActionSchema),
  nextNodes: z.array(z.string()).optional(),
  conditions: z
    .array(
      z.object({
        expression: z.string(),
        targetNodeId: z.string(),
      })
    )
    .optional(),
});

const appointmentSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

const appointmentServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().min(5),
  description: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
});

// =============================================================================
// Router
// =============================================================================

export const metaBotRouter = router({
  // =========================================================================
  // Settings
  // =========================================================================

  /**
   * Get bot settings for a page
   */
  getSettings: organizationProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      let config = await getConversationConfig(input.pageId);

      // Create default config if doesn't exist
      if (!config) {
        config = await createDefaultConversationConfig(
          input.pageId,
          ctx.organization.id
        );
      }

      return {
        id: config.id,
        pageId: config.metaPageId,
        aiEnabled: config.aiEnabled,
        aiPersonality: config.aiPersonality,
        aiTemperature: config.aiTemperature,
        welcomeMessage: config.welcomeMessage,
        awayMessage: config.awayMessage,
        businessHours: config.businessHours,
        responseRules: config.responseRules,
        handoffKeywords: config.handoffKeywords,
        handoffNotificationEmail: config.handoffNotificationEmail,
        useOrganizationContext: config.useOrganizationContext,
        useWebsiteContext: config.useWebsiteContext,
        additionalContext: config.additionalContext,
        salesAssistantEnabled: config.salesAssistantEnabled,
        customerSupportEnabled: config.customerSupportEnabled,
        appointmentSchedulingEnabled: config.appointmentSchedulingEnabled,
        flowsEnabled: config.flowsEnabled,
        fallbackToAi: config.fallbackToAi,
        salesConfig: config.salesConfig,
        supportConfig: config.supportConfig,
      };
    }),

  /**
   * Update bot settings for a page
   */
  updateSettings: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        aiEnabled: z.boolean().optional(),
        aiPersonality: aiPersonalitySchema.optional(),
        aiTemperature: z.number().min(0).max(1).optional(),
        welcomeMessage: z.string().nullable().optional(),
        awayMessage: z.string().nullable().optional(),
        businessHours: businessHoursSchema.nullable().optional(),
        responseRules: z.array(responseRuleSchema).nullable().optional(),
        handoffKeywords: z.array(z.string()).nullable().optional(),
        handoffNotificationEmail: z.string().email().nullable().optional(),
        useOrganizationContext: z.boolean().optional(),
        useWebsiteContext: z.boolean().optional(),
        additionalContext: z.string().nullable().optional(),
        salesAssistantEnabled: z.boolean().optional(),
        customerSupportEnabled: z.boolean().optional(),
        appointmentSchedulingEnabled: z.boolean().optional(),
        flowsEnabled: z.boolean().optional(),
        fallbackToAi: z.boolean().optional(),
        salesConfig: salesConfigSchema.nullable().optional(),
        supportConfig: supportConfigSchema.nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pageId, ...updates } = input;

      // Ensure config exists
      let config = await getConversationConfig(pageId);
      if (!config) {
        config = await createDefaultConversationConfig(
          pageId,
          ctx.organization.id
        );
      }

      // Build update object - filter out undefined values
      // Convert aiTemperature from number to string for database storage
      const processedUpdates = {
        ...updates,
        aiTemperature:
          updates.aiTemperature !== undefined
            ? updates.aiTemperature.toFixed(2)
            : undefined,
      };
      const updateData = Object.fromEntries(
        Object.entries(processedUpdates).filter(
          ([_, value]) => value !== undefined
        )
      );

      await db
        .update(metaConversationConfigTable)
        .set(updateData)
        .where(eq(metaConversationConfigTable.id, config.id));

      return { success: true };
    }),

  /**
   * Test bot response
   */
  testResponse: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        message: z.string().min(1),
        intent: z
          .enum(["sales", "support", "appointment", "general"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await getConversationConfig(input.pageId);

      const response = await testAiResponse(
        ctx.organization.id,
        config || {},
        input.message,
        input.intent
      );

      return { response };
    }),

  // =========================================================================
  // Team Inbox
  // =========================================================================

  /**
   * List inbox items
   */
  listInbox: organizationProcedure
    .input(
      z.object({
        status: z
          .enum(["open", "in_progress", "waiting", "resolved", "closed"])
          .optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        assignedToMe: z.boolean().optional(),
        unassigned: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(metaTeamInboxTable.organizationId, ctx.organization.id),
      ];

      if (input.status) {
        conditions.push(eq(metaTeamInboxTable.status, input.status));
      }
      if (input.priority) {
        conditions.push(eq(metaTeamInboxTable.priority, input.priority));
      }
      if (input.assignedToMe) {
        conditions.push(
          eq(metaTeamInboxTable.assignedToUserId, ctx.session.userId)
        );
      }
      if (input.unassigned) {
        // Filter for null assigned
      }

      const items = await db.query.metaTeamInboxTable.findMany({
        where: and(...conditions),
        orderBy: [desc(metaTeamInboxTable.createdAt)],
        limit: input.limit + 1,
        with: {
          metaConversation: true,
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, -1) : items;

      return {
        items: data.map((item) => ({
          id: item.id,
          conversationId: item.metaConversationId,
          priority: item.priority,
          status: item.status,
          handoffReason: item.handoffReason,
          handoffTriggeredBy: item.handoffTriggeredBy,
          assignedToUserId: item.assignedToUserId,
          assignedAt: item.assignedAt,
          firstResponseAt: item.firstResponseAt,
          resolvedAt: item.resolvedAt,
          internalNotes: item.internalNotes,
          tags: item.tags,
          createdAt: item.createdAt,
          conversation: item.metaConversation
            ? {
                participantName: item.metaConversation.participantName,
                participantProfilePic:
                  item.metaConversation.participantProfilePic,
                platform: item.metaConversation.platform,
                lastMessagePreview: item.metaConversation.lastMessagePreview,
                lastMessageAt: item.metaConversation.lastMessageAt,
              }
            : null,
        })),
        hasMore,
        nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
      };
    }),

  /**
   * Assign inbox item to user
   */
  assignInbox: organizationProcedure
    .input(
      z.object({
        inboxId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(metaTeamInboxTable)
        .set({
          assignedToUserId: input.userId,
          assignedAt: new Date(),
          status: "in_progress",
        })
        .where(
          and(
            eq(metaTeamInboxTable.id, input.inboxId),
            eq(metaTeamInboxTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),

  /**
   * Update inbox status
   */
  updateInboxStatus: organizationProcedure
    .input(
      z.object({
        inboxId: z.string().uuid(),
        status: z.enum([
          "open",
          "in_progress",
          "waiting",
          "resolved",
          "closed",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.status === "resolved" || input.status === "closed") {
        updateData.resolvedAt = new Date();
      }

      await db
        .update(metaTeamInboxTable)
        .set(updateData)
        .where(
          and(
            eq(metaTeamInboxTable.id, input.inboxId),
            eq(metaTeamInboxTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),

  /**
   * Update inbox priority
   */
  updateInboxPriority: organizationProcedure
    .input(
      z.object({
        inboxId: z.string().uuid(),
        priority: z.enum(["low", "normal", "high", "urgent"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(metaTeamInboxTable)
        .set({ priority: input.priority })
        .where(
          and(
            eq(metaTeamInboxTable.id, input.inboxId),
            eq(metaTeamInboxTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),

  /**
   * Return conversation to bot
   */
  returnToBot: organizationProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Update conversation state
      await returnToBotMode(input.conversationId);

      // Update inbox status
      await db
        .update(metaTeamInboxTable)
        .set({
          status: "resolved",
          resolvedAt: new Date(),
        })
        .where(
          and(
            eq(metaTeamInboxTable.metaConversationId, input.conversationId),
            eq(metaTeamInboxTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get inbox stats
   */
  getInboxStats: organizationProcedure.query(async ({ ctx }) => {
    const allItems = await db.query.metaTeamInboxTable.findMany({
      where: eq(metaTeamInboxTable.organizationId, ctx.organization.id),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: allItems.length,
      open: allItems.filter((i) => i.status === "open").length,
      inProgress: allItems.filter((i) => i.status === "in_progress").length,
      waiting: allItems.filter((i) => i.status === "waiting").length,
      resolved: allItems.filter((i) => i.status === "resolved").length,
      unassigned: allItems.filter((i) => !i.assignedToUserId).length,
      urgent: allItems.filter((i) => i.priority === "urgent").length,
      resolvedToday: allItems.filter(
        (i) =>
          i.status === "resolved" &&
          i.resolvedAt &&
          new Date(i.resolvedAt) >= today
      ).length,
    };

    return stats;
  }),

  // =========================================================================
  // Bot Flows
  // =========================================================================

  /**
   * List flows for a page
   */
  listFlows: organizationProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const flows = await db.query.metaBotFlowTable.findMany({
        where: and(
          eq(metaBotFlowTable.metaPageId, input.pageId),
          eq(metaBotFlowTable.organizationId, ctx.organization.id)
        ),
        orderBy: [desc(metaBotFlowTable.priority)],
      });

      return flows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        flowType: flow.flowType,
        priority: flow.priority,
        isActive: flow.isActive,
        triggerCount: flow.triggerCount,
        completionCount: flow.completionCount,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      }));
    }),

  /**
   * Get flow details
   */
  getFlow: organizationProcedure
    .input(z.object({ flowId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const flow = await db.query.metaBotFlowTable.findFirst({
        where: and(
          eq(metaBotFlowTable.id, input.flowId),
          eq(metaBotFlowTable.organizationId, ctx.organization.id)
        ),
      });

      if (!flow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flow not found" });
      }

      return flow;
    }),

  /**
   * Create a new flow
   */
  createFlow: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        flowType: z.enum(["override", "automation"]),
        nodes: z.array(flowNodeSchema),
        entryNodeId: z.string(),
        globalTriggers: z.array(flowTriggerSchema).optional(),
        priority: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [flow] = await db
        .insert(metaBotFlowTable)
        .values({
          metaPageId: input.pageId,
          organizationId: ctx.organization.id,
          name: input.name,
          description: input.description,
          flowType: input.flowType,
          nodes: input.nodes,
          entryNodeId: input.entryNodeId,
          globalTriggers: input.globalTriggers,
          priority: input.priority,
          isActive: true,
        })
        .returning();

      return flow;
    }),

  /**
   * Update a flow
   */
  updateFlow: organizationProcedure
    .input(
      z.object({
        flowId: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        nodes: z.array(flowNodeSchema).optional(),
        entryNodeId: z.string().optional(),
        globalTriggers: z.array(flowTriggerSchema).nullable().optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { flowId, ...updates } = input;

      const [updatedFlow] = await db
        .update(metaBotFlowTable)
        .set(updates)
        .where(
          and(
            eq(metaBotFlowTable.id, flowId),
            eq(metaBotFlowTable.organizationId, ctx.organization.id)
          )
        )
        .returning();

      return updatedFlow;
    }),

  /**
   * Delete a flow
   */
  deleteFlow: organizationProcedure
    .input(z.object({ flowId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(metaBotFlowTable)
        .where(
          and(
            eq(metaBotFlowTable.id, input.flowId),
            eq(metaBotFlowTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),

  // =========================================================================
  // Appointments
  // =========================================================================

  /**
   * Get appointment config for a page
   */
  getAppointmentConfig: organizationProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const config = await db.query.metaAppointmentConfigTable.findFirst({
        where: and(
          eq(metaAppointmentConfigTable.metaPageId, input.pageId),
          eq(metaAppointmentConfigTable.organizationId, ctx.organization.id)
        ),
      });

      return config;
    }),

  /**
   * Update appointment config
   */
  updateAppointmentConfig: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid(),
        timezone: z.string().optional(),
        availableSlots: z.array(appointmentSlotSchema).nullable().optional(),
        bufferMinutes: z.number().min(0).optional(),
        maxAdvanceDays: z.number().min(1).optional(),
        minAdvanceHours: z.number().min(0).optional(),
        services: z.array(appointmentServiceSchema).nullable().optional(),
        confirmationMessage: z.string().nullable().optional(),
        reminderEnabled: z.boolean().optional(),
        reminderHoursBefore: z.number().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pageId, ...updates } = input;

      // Check if config exists
      const existing = await db.query.metaAppointmentConfigTable.findFirst({
        where: eq(metaAppointmentConfigTable.metaPageId, pageId),
      });

      if (existing) {
        await db
          .update(metaAppointmentConfigTable)
          .set(updates)
          .where(eq(metaAppointmentConfigTable.id, existing.id));
      } else {
        await db.insert(metaAppointmentConfigTable).values({
          metaPageId: pageId,
          organizationId: ctx.organization.id,
          ...updates,
        });
      }

      return { success: true };
    }),

  /**
   * List appointments
   */
  listAppointments: organizationProcedure
    .input(
      z.object({
        pageId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z
          .enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(metaAppointmentTable.organizationId, ctx.organization.id),
      ];

      if (input.pageId) {
        conditions.push(eq(metaAppointmentTable.metaPageId, input.pageId));
      }
      if (input.status) {
        conditions.push(eq(metaAppointmentTable.status, input.status));
      }

      const appointments = await db.query.metaAppointmentTable.findMany({
        where: and(...conditions),
        orderBy: [desc(metaAppointmentTable.scheduledAt)],
        limit: input.limit,
      });

      return appointments;
    }),

  /**
   * Cancel an appointment
   */
  cancelAppointment: organizationProcedure
    .input(
      z.object({
        appointmentId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(metaAppointmentTable)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        })
        .where(
          and(
            eq(metaAppointmentTable.id, input.appointmentId),
            eq(metaAppointmentTable.organizationId, ctx.organization.id)
          )
        );

      return { success: true };
    }),
});
