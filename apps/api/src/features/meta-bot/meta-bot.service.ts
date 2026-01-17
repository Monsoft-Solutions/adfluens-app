/**
 * Meta Bot Service
 *
 * Main orchestration layer that determines how to handle incoming messages.
 * Coordinates between AI, flows, handoff, and conversation state management.
 */

import {
  db,
  eq,
  and,
  sql,
  metaConversationConfigTable,
  metaConversationStateTable,
  metaTeamInboxTable,
  metaBotFlowTable,
  metaPageTable,
  metaConversationTable,
} from "@repo/db";
import type {
  MetaConversationConfigRow,
  MetaConversationStateRow,
  MetaConversationContext,
  MetaBotFlowRow,
  MetaAiNodeActionConfig,
} from "@repo/db";
import {
  detectIntent,
  generateAiResponse,
  shouldTriggerHandoff,
  checkResponseRules,
  isWithinBusinessHours,
  buildBusinessContext,
  detectLanguage,
  translateMessage,
  isLanguageSupported,
  executeAiNodeOperation,
} from "./meta-bot-ai.service";
import { notifyHandoffRequest } from "../meta/meta-notification.service";
import {
  scheduleFlowExecution,
  cancelPendingExecutions,
} from "./scheduled-execution.service";
import {
  interpolateVariables,
  createInterpolationContext,
} from "./utils/variable-interpolation.utils";
import {
  recallUserMemory,
  extractMemoryFromConversation,
  buildMemoryPrompt,
} from "./meta-bot-memory.service";
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "meta-bot" });

// =============================================================================
// Constants
// =============================================================================

const MAX_EXECUTION_DEPTH = 50;
const MAX_REGEX_LENGTH = 100;
const HTTP_REQUEST_TIMEOUT_MS = 10000;

// =============================================================================
// Security Helpers
// =============================================================================

/**
 * Validates a regex pattern for safety to prevent ReDoS attacks.
 * Rejects patterns with nested quantifiers and excessive backtracking.
 */
function isSafeRegex(pattern: string): boolean {
  // Reject patterns over max length
  if (pattern.length > MAX_REGEX_LENGTH) return false;

  // Reject nested quantifiers (ReDoS patterns like (a+)+)
  if (/([+*?]|\{\d+,?\d*\})\s*([+*?]|\{\d+,?\d*\})/.test(pattern)) return false;

  // Reject patterns with quantifiers inside groups followed by quantifiers
  if (/\([^)]*[+*][^)]*\)[+*]/.test(pattern)) return false;

  // Reject patterns with alternation inside groups followed by quantifiers
  if (/\([^)]*\|[^)]*\)[+*]/.test(pattern)) return false;

  return true;
}

/**
 * Validates a URL to prevent SSRF attacks.
 * Blocks localhost, private IPs, and cloud metadata endpoints.
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Block non-HTTP(S) protocols
    if (!["http:", "https:"].includes(url.protocol)) return false;

    // Block localhost
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    )
      return false;

    // Block cloud metadata endpoints
    if (hostname === "169.254.169.254") return false;
    if (hostname === "metadata.google.internal") return false;

    // Block private IP ranges
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      // 10.0.0.0/8
      if (parts[0] === 10) return false;
      // 172.16.0.0/12
      if (
        parts[0] === 172 &&
        parts[1] !== undefined &&
        parts[1] >= 16 &&
        parts[1] <= 31
      )
        return false;
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return false;
      // 127.0.0.0/8
      if (parts[0] === 127) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Types
// =============================================================================

export type BotResponse = {
  handled: boolean;
  response?: string;
  reason?: string;
  shouldHandoff?: boolean;
  handoffReason?: string;
  updatedContext?: Partial<MetaConversationContext>;
};

export type ProcessMessageOptions = {
  conversationId: string;
  pageId: string;
  organizationId: string;
  message: string;
  platform: "messenger" | "instagram";
  participantId?: string;
  participantName?: string;
};

export type FlowExecutionContext = {
  organizationId: string;
  metaPageId: string;
  conversationId: string;
};

// =============================================================================
// Main Processing
// =============================================================================

/**
 * Process an incoming message and generate a bot response
 */
export async function processIncomingMessage(
  options: ProcessMessageOptions
): Promise<BotResponse> {
  const { conversationId, pageId, organizationId, message, platform } = options;

  // 1. Get conversation config
  const config = await getConversationConfig(pageId);
  if (!config || !config.aiEnabled) {
    return { handled: false, reason: "ai_disabled" };
  }

  // 2. Get or create conversation state
  const state = await getOrCreateConversationState(
    conversationId,
    organizationId
  );

  // 2.5. Cancel any pending scheduled executions (user sent a new message during delay)
  await cancelPendingExecutions(conversationId);

  // 2.6. Detect language if auto-translate is enabled and not already detected
  let userLanguage = state.context.detectedLanguage;
  if (config.autoTranslateEnabled && !userLanguage) {
    const detected = await detectLanguage(message);
    userLanguage = {
      code: detected.code,
      name: detected.name,
      confidence: detected.confidence,
      detectedAt: new Date().toISOString(),
    };
    // Store detected language in state
    await updateConversationState(state.id, {
      context: {
        ...state.context,
        detectedLanguage: userLanguage,
      },
    });
    state.context.detectedLanguage = userLanguage;
    logger.debug("Detected language", {
      name: detected.name,
      code: detected.code,
      confidence: detected.confidence,
    });
  }

  // 2.7. Recall and update user memory for personalization
  let memoryContext = "";
  if (options.participantId) {
    // Recall past memory if this is a new or recent conversation
    if (!state.context.userMemory) {
      const recalledMemory = await recallUserMemory(
        options.participantId,
        pageId,
        { recallTypes: ["all"], lookbackDays: 90 }
      );
      if (recalledMemory) {
        state.context.userMemory = recalledMemory;
        memoryContext = buildMemoryPrompt(recalledMemory);
        await updateConversationState(state.id, {
          context: {
            ...state.context,
            userMemory: recalledMemory,
          },
        });
        logger.debug("Recalled memory for returning customer", {
          name: recalledMemory.name,
        });
      }
    } else {
      memoryContext = buildMemoryPrompt(state.context.userMemory);
    }

    // Auto-extract memory from current message
    const updatedMemory = await extractMemoryFromConversation(
      message,
      state.context.userMemory
    );
    if (
      JSON.stringify(updatedMemory) !== JSON.stringify(state.context.userMemory)
    ) {
      state.context.userMemory = updatedMemory;
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          userMemory: updatedMemory,
        },
      });
    }
  }

  // Helper to translate response if needed
  const maybeTranslate = async (response: string): Promise<string> => {
    if (
      !config.autoTranslateEnabled ||
      !userLanguage ||
      userLanguage.code === "en" ||
      !isLanguageSupported(
        userLanguage.code,
        config.supportedLanguages ?? undefined
      )
    ) {
      return response;
    }
    return translateMessage(response, userLanguage.code, userLanguage.name);
  };

  // 3. Check if human is handling (bypass bot)
  if (state.botMode === "human") {
    return { handled: false, reason: "human_handling" };
  }

  // 4. Check business hours
  if (!isWithinBusinessHours(config.businessHours)) {
    if (config.awayMessage) {
      const translatedAway = await maybeTranslate(config.awayMessage);
      return {
        handled: true,
        response: translatedAway,
        reason: "away_message",
      };
    }
    return { handled: false, reason: "outside_business_hours" };
  }

  // 5. Check custom response rules (highest priority)
  const ruleResponse = checkResponseRules(message, config.responseRules);
  if (ruleResponse) {
    const translatedRule = await maybeTranslate(ruleResponse);
    return { handled: true, response: translatedRule, reason: "response_rule" };
  }

  // Flow execution context for delay scheduling
  const flowContext: FlowExecutionContext = {
    organizationId,
    metaPageId: pageId,
    conversationId,
  };

  // 6. Check if in an active flow
  if (state.botMode === "flow" && state.context.currentFlowId) {
    const flowResult = await executeFlowNode(
      state,
      message,
      config,
      flowContext
    );
    if (flowResult.handled) {
      // Translate flow response if needed
      if (flowResult.response) {
        flowResult.response = await maybeTranslate(flowResult.response);
      }
      return flowResult;
    }
    // If flow didn't handle, fall through to AI
  }

  // 7. Check flow triggers (if flows enabled)
  if (config.flowsEnabled) {
    const triggeredFlow = await findTriggeredFlow(pageId, message);
    if (triggeredFlow) {
      const flowResult = await startFlow(
        state,
        triggeredFlow,
        message,
        flowContext
      );
      if (flowResult.handled) {
        // Translate flow response if needed
        if (flowResult.response) {
          flowResult.response = await maybeTranslate(flowResult.response);
        }
        return flowResult;
      }
    }
  }

  // 8. Detect intent
  const businessContext = await buildBusinessContext(organizationId);
  const intent = await detectIntent(message, businessContext);

  // 9. Check handoff triggers
  const handoffCheck = shouldTriggerHandoff(message, intent, config);
  if (handoffCheck.shouldHandoff) {
    await initiateHandoff(
      conversationId,
      organizationId,
      state,
      config,
      handoffCheck.reason || "triggered",
      options.participantName
    );
    const handoffMessage = await maybeTranslate(
      "I'll connect you with a team member who can help you better. Someone will be with you shortly!"
    );
    return {
      handled: true,
      shouldHandoff: true,
      handoffReason: handoffCheck.reason,
      response: handoffMessage,
    };
  }

  // 10. Generate AI response
  try {
    const aiResult = await generateAiResponse({
      organizationId,
      config,
      message,
      platform,
      conversationId,
      intent,
      conversationState: state,
      memoryContext,
    });

    // Translate AI response if needed
    const translatedResponse = await maybeTranslate(aiResult.response);

    // Update conversation state if needed
    if (aiResult.updatedContext) {
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          ...aiResult.updatedContext,
          lastUserMessage: message,
          lastAiResponse: translatedResponse,
        },
        lastUserMessageAt: new Date(),
        lastBotResponseAt: new Date(),
      });
    } else {
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          lastUserMessage: message,
          lastAiResponse: translatedResponse,
          intentHistory: [
            ...(state.context.intentHistory || []),
            intent.category,
          ].slice(-10),
        },
        lastUserMessageAt: new Date(),
        lastBotResponseAt: new Date(),
      });
    }

    return {
      handled: true,
      response: translatedResponse,
      reason: `ai_${intent.category}`,
      updatedContext: aiResult.updatedContext,
    };
  } catch (error) {
    logger.error("AI response generation failed", error);
    return { handled: false, reason: "ai_error" };
  }
}

// =============================================================================
// Conversation Config
// =============================================================================

/**
 * Get conversation config for a page
 */
export async function getConversationConfig(
  pageId: string,
  organizationId?: string
): Promise<MetaConversationConfigRow | null> {
  const conditions = [eq(metaConversationConfigTable.metaPageId, pageId)];
  if (organizationId) {
    conditions.push(
      eq(metaConversationConfigTable.organizationId, organizationId)
    );
  }

  const config = await db.query.metaConversationConfigTable.findFirst({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
  });
  return config ?? null;
}

/**
 * Create default conversation config for a page
 */
export async function createDefaultConversationConfig(
  pageId: string,
  organizationId: string
): Promise<MetaConversationConfigRow> {
  const [config] = await db
    .insert(metaConversationConfigTable)
    .values({
      metaPageId: pageId,
      organizationId,
      aiEnabled: true,
      aiTemperature: "0.70",
      useOrganizationContext: true,
      useWebsiteContext: true,
      customerSupportEnabled: true,
      salesAssistantEnabled: false,
      appointmentSchedulingEnabled: false,
      flowsEnabled: false,
      fallbackToAi: true,
      autoTranslateEnabled: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "it"],
      defaultLanguage: "en",
    })
    .returning();

  if (!config) {
    throw new Error("Failed to create conversation config");
  }

  return config;
}

// =============================================================================
// Conversation State
// =============================================================================

/**
 * Get or create conversation state
 */
export async function getOrCreateConversationState(
  conversationId: string,
  organizationId: string
): Promise<MetaConversationStateRow> {
  const existing = await db.query.metaConversationStateTable.findFirst({
    where: eq(metaConversationStateTable.metaConversationId, conversationId),
  });

  if (existing) {
    return existing;
  }

  const [newState] = await db
    .insert(metaConversationStateTable)
    .values({
      metaConversationId: conversationId,
      organizationId,
      context: {
        variables: {},
        collectedInputs: {},
        intentHistory: [],
      },
      botMode: "ai",
    })
    .returning();

  if (!newState) {
    throw new Error("Failed to create conversation state");
  }

  return newState;
}

/**
 * Update conversation state
 */
export async function updateConversationState(
  stateId: string,
  updates: Partial<MetaConversationStateRow>
): Promise<void> {
  await db
    .update(metaConversationStateTable)
    .set(updates)
    .where(eq(metaConversationStateTable.id, stateId));
}

/**
 * Set conversation to human handling mode
 */
export async function setHumanHandlingMode(
  conversationId: string
): Promise<void> {
  const state = await db.query.metaConversationStateTable.findFirst({
    where: eq(metaConversationStateTable.metaConversationId, conversationId),
  });

  if (state) {
    await db
      .update(metaConversationStateTable)
      .set({ botMode: "human" })
      .where(eq(metaConversationStateTable.id, state.id));
  }
}

/**
 * Return conversation to bot handling
 */
export async function returnToBotMode(conversationId: string): Promise<void> {
  const state = await db.query.metaConversationStateTable.findFirst({
    where: eq(metaConversationStateTable.metaConversationId, conversationId),
  });

  if (state) {
    await db
      .update(metaConversationStateTable)
      .set({
        botMode: "ai",
        context: {
          ...state.context,
          currentFlowId: undefined,
          currentNodeId: undefined,
        },
      })
      .where(eq(metaConversationStateTable.id, state.id));
  }
}

// =============================================================================
// Handoff
// =============================================================================

/**
 * Initiate human handoff for a conversation
 */
async function initiateHandoff(
  conversationId: string,
  organizationId: string,
  state: MetaConversationStateRow,
  config: MetaConversationConfigRow,
  reason: string,
  _participantName?: string
): Promise<void> {
  // Set to human mode
  await updateConversationState(state.id, {
    botMode: "human",
    context: {
      ...state.context,
      handoffReason: reason,
    },
  });

  // Check if inbox item already exists
  const existingInbox = await db.query.metaTeamInboxTable.findFirst({
    where: eq(metaTeamInboxTable.metaConversationId, conversationId),
  });

  if (!existingInbox) {
    // Create inbox item
    await db.insert(metaTeamInboxTable).values({
      metaConversationId: conversationId,
      organizationId,
      priority: "normal",
      status: "open",
      handoffReason: reason,
      handoffTriggeredBy: reason.includes("keyword")
        ? "keyword"
        : reason === "user_request"
          ? "user_request"
          : "sentiment",
    });
  } else {
    // Update existing inbox item
    await db
      .update(metaTeamInboxTable)
      .set({
        status: "open",
        handoffReason: reason,
        resolvedAt: null,
      })
      .where(eq(metaTeamInboxTable.id, existingInbox.id));
  }

  // Send notification
  // Get page and conversation info for notification
  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.id, config.metaPageId),
  });

  const conversation = await db.query.metaConversationTable.findFirst({
    where: eq(metaConversationTable.id, conversationId),
  });

  if (page) {
    await notifyHandoffRequest({
      pageId: config.metaPageId,
      organizationId,
      conversationId,
      pageName: page.pageName,
      platform:
        (conversation?.platform as "messenger" | "instagram") || "messenger",
      reason,
    });
  }
}

// =============================================================================
// Flow Execution (Placeholder)
// =============================================================================

/**
 * Find a flow that matches the message triggers
 */
async function findTriggeredFlow(
  pageId: string,
  message: string
): Promise<MetaBotFlowRow | null> {
  const flows = await db.query.metaBotFlowTable.findMany({
    where: and(
      eq(metaBotFlowTable.metaPageId, pageId),
      eq(metaBotFlowTable.isActive, true)
    ),
    orderBy: (flows, { desc }) => [desc(flows.priority)],
  });

  const lowerMessage = message.toLowerCase();

  for (const flow of flows) {
    if (!flow.globalTriggers?.length) continue;

    for (const trigger of flow.globalTriggers) {
      let matches = false;

      switch (trigger.type) {
        case "keyword": {
          const keyword = trigger.caseSensitive
            ? trigger.value
            : trigger.value.toLowerCase();
          const msgToCheck = trigger.caseSensitive ? message : lowerMessage;

          switch (trigger.matchMode) {
            case "exact":
              matches = msgToCheck === keyword;
              break;
            case "starts_with":
              matches = msgToCheck.startsWith(keyword);
              break;
            case "ends_with":
              matches = msgToCheck.endsWith(keyword);
              break;
            default:
              matches = msgToCheck.includes(keyword);
          }
          break;
        }
        case "regex": {
          // Validate regex pattern for safety (ReDoS prevention)
          if (!isSafeRegex(trigger.value)) {
            logger.warn("Unsafe regex pattern rejected", {
              pattern: trigger.value.substring(0, 50),
            });
            break;
          }
          try {
            const regex = new RegExp(
              trigger.value,
              trigger.caseSensitive ? "" : "i"
            );
            matches = regex.test(message);
          } catch {
            // Invalid regex, skip
          }
          break;
        }
      }

      if (matches) {
        // Increment trigger count atomically
        await db
          .update(metaBotFlowTable)
          .set({ triggerCount: sql`${metaBotFlowTable.triggerCount} + 1` })
          .where(eq(metaBotFlowTable.id, flow.id));

        return flow;
      }
    }
  }

  return null;
}

/**
 * Start a flow for a conversation
 */
async function startFlow(
  state: MetaConversationStateRow,
  flow: MetaBotFlowRow,
  message: string,
  context: FlowExecutionContext
): Promise<BotResponse> {
  // Update state to flow mode
  await updateConversationState(state.id, {
    botMode: "flow",
    context: {
      ...state.context,
      currentFlowId: flow.id,
      currentNodeId: flow.entryNodeId,
    },
  });

  // Execute entry node
  const entryNode = flow.nodes.find((n) => n.id === flow.entryNodeId);
  if (!entryNode) {
    return { handled: false, reason: "invalid_flow" };
  }

  return executeNode(entryNode, state, flow, context, message);
}

/**
 * Execute a flow node
 */
async function executeFlowNode(
  state: MetaConversationStateRow,
  message: string,
  config: MetaConversationConfigRow,
  flowContext: FlowExecutionContext
): Promise<BotResponse> {
  if (!state.context.currentFlowId || !state.context.currentNodeId) {
    return { handled: false };
  }

  const flow = await db.query.metaBotFlowTable.findFirst({
    where: eq(metaBotFlowTable.id, state.context.currentFlowId),
  });

  if (!flow) {
    // Flow deleted, exit flow mode
    await updateConversationState(state.id, {
      botMode: "ai",
      context: {
        ...state.context,
        currentFlowId: undefined,
        currentNodeId: undefined,
      },
    });
    return { handled: false };
  }

  const currentNode = flow.nodes.find(
    (n) => n.id === state.context.currentNodeId
  );
  if (!currentNode) {
    return { handled: false };
  }

  // Check conditions to determine next node
  if (currentNode.conditions?.length) {
    for (const condition of currentNode.conditions) {
      // Simple condition evaluation (can be enhanced)
      if (evaluateCondition(condition.expression, message, state)) {
        const nextNode = flow.nodes.find(
          (n) => n.id === condition.targetNodeId
        );
        if (nextNode) {
          await updateConversationState(state.id, {
            context: {
              ...state.context,
              currentNodeId: nextNode.id,
            },
          });
          return executeNode(nextNode, state, flow, flowContext, message);
        }
      }
    }
  }

  // Default to next node if available
  if (currentNode.nextNodes?.length) {
    const nextNode = flow.nodes.find((n) => n.id === currentNode.nextNodes![0]);
    if (nextNode) {
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          currentNodeId: nextNode.id,
        },
      });
      return executeNode(nextNode, state, flow, flowContext, message);
    }
  }

  // Exit flow if no more nodes
  await updateConversationState(state.id, {
    botMode: config.fallbackToAi ? "ai" : "human",
    context: {
      ...state.context,
      currentFlowId: undefined,
      currentNodeId: undefined,
    },
  });

  // Increment completion count atomically
  await db
    .update(metaBotFlowTable)
    .set({ completionCount: sql`${metaBotFlowTable.completionCount} + 1` })
    .where(eq(metaBotFlowTable.id, flow.id));

  return { handled: false };
}

/**
 * Execute a single node and return response
 * @param depth - Current recursion depth (for loop protection)
 * @param visitedNodes - Set of node IDs already visited in this execution chain
 */
async function executeNode(
  node: MetaBotFlowRow["nodes"][0],
  state: MetaConversationStateRow,
  flow: MetaBotFlowRow,
  flowContext: FlowExecutionContext,
  message: string,
  depth: number = 0,
  visitedNodes: Set<string> = new Set()
): Promise<BotResponse> {
  // Protection against infinite recursion
  if (depth > MAX_EXECUTION_DEPTH) {
    logger.error("Max execution depth exceeded", {
      maxDepth: MAX_EXECUTION_DEPTH,
      nodeId: node.id,
    });
    return { handled: false, reason: "max_depth_exceeded" };
  }

  // Protection against circular references in goto_node chains
  if (visitedNodes.has(node.id)) {
    logger.warn("Circular reference detected, stopping execution", {
      nodeId: node.id,
    });
    return { handled: false, reason: "circular_reference" };
  }

  visitedNodes.add(node.id);
  const responses: string[] = [];

  for (const action of node.actions) {
    switch (action.type) {
      case "send_message": {
        const msg = action.config.message as string;
        if (msg) responses.push(msg);
        break;
      }
      case "send_quick_replies": {
        const msg = action.config.message as string;
        if (msg) responses.push(msg);
        // Quick replies would be handled by the platform
        break;
      }
      case "handoff": {
        return {
          handled: true,
          shouldHandoff: true,
          handoffReason: (action.config.reason as string) || "flow_handoff",
          response: responses.join("\n") || undefined,
        };
      }
      case "ai_node": {
        const aiConfig = action.config as MetaAiNodeActionConfig;
        const operation = aiConfig.operation || "generate_response";

        // For generate_response with no custom config, fall back to existing AI response
        if (
          operation === "generate_response" &&
          !aiConfig.customSystemPrompt &&
          !aiConfig.customUserPrompt
        ) {
          return { handled: false, reason: "ai_fallback" };
        }

        // Execute AI node operation
        const aiResult = await executeAiNodeOperation(aiConfig, {
          message,
          organizationId: flowContext.organizationId,
          conversationId: flowContext.conversationId,
          variables: state.context.variables,
          collectedInputs: state.context.collectedInputs,
        });

        if (!aiResult.success) {
          logger.error("AI node operation failed", { error: aiResult.error });
          // Continue execution on error (don't block flow)
          break;
        }

        // Store result in variable if specified
        if (aiConfig.outputVariable && aiResult.result !== undefined) {
          const updatedVariables = {
            ...state.context.variables,
            [aiConfig.outputVariable]: aiResult.result,
          };

          await updateConversationState(state.id, {
            context: {
              ...state.context,
              variables: updatedVariables,
            },
          });

          state.context.variables = updatedVariables;
          logger.debug("AI node stored result in variable", {
            variableName: aiConfig.outputVariable,
          });
        }

        // Send as message if specified (default true for generate operations)
        const shouldSendAsMessage =
          aiConfig.sendAsMessage ??
          (operation === "generate_response" ||
            operation === "generate_content" ||
            operation === "custom");

        if (shouldSendAsMessage && aiResult.textResult) {
          responses.push(aiResult.textResult);
        }

        break;
      }
      case "delay": {
        // Schedule the next node for later execution
        const delayAmount = (action.config.delayAmount as number) || 1;
        const delayUnit =
          (action.config.delayUnit as "minutes" | "hours" | "days") || "days";

        // Only schedule if there's a next node
        if (node.nextNodes?.length) {
          await scheduleFlowExecution({
            organizationId: flowContext.organizationId,
            metaPageId: flowContext.metaPageId,
            conversationId: flowContext.conversationId,
            flowId: flow.id,
            nextNodeId: node.nextNodes[0]!,
            delayAmount,
            delayUnit,
            conversationContext: state.context,
          });

          logger.debug("Scheduled delay", {
            delayAmount,
            delayUnit,
            conversationId: flowContext.conversationId,
          });
        }

        // Return with any message that was collected before the delay
        return {
          handled: true,
          response: responses.join("\n") || undefined,
          reason: "flow_delay_scheduled",
        };
      }
      case "set_variable": {
        const config = action.config as {
          variableName: string;
          value: unknown;
        };
        const { variableName, value } = config;

        // Create interpolation context
        const interpolationContext = createInterpolationContext(
          state.context.variables,
          state.context.collectedInputs
        );

        // Interpolate the value if it's a string containing {{}}
        const resolvedValue =
          typeof value === "string"
            ? interpolateVariables(value, interpolationContext)
            : value;

        // Update state with new variable
        await updateConversationState(state.id, {
          context: {
            ...state.context,
            variables: {
              ...state.context.variables,
              [variableName]: resolvedValue,
            },
          },
        });

        // Update local state reference for subsequent actions
        state.context.variables[variableName] = resolvedValue;
        logger.debug("Set variable", { variableName, value: resolvedValue });
        break;
      }
      case "http_request": {
        const config = action.config as {
          method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
          url: string;
          headers?: Record<string, string>;
          body?: string;
          responseVariable?: string;
        };

        const interpolationContext = createInterpolationContext(
          state.context.variables,
          state.context.collectedInputs
        );

        // Interpolate URL and body
        const url = interpolateVariables(config.url, interpolationContext);
        const body = config.body
          ? interpolateVariables(config.body, interpolationContext)
          : undefined;

        // SSRF protection: validate URL before making request
        if (!isAllowedUrl(url)) {
          logger.warn("Blocked request to disallowed URL", {
            url: url.substring(0, 100),
          });
          if (config.responseVariable) {
            const updatedVariables = {
              ...state.context.variables,
              [config.responseVariable]: null,
              [`${config.responseVariable}_error`]: "URL not allowed",
              [`${config.responseVariable}_ok`]: false,
            };
            await updateConversationState(state.id, {
              context: { ...state.context, variables: updatedVariables },
            });
            state.context.variables = updatedVariables;
          }
          break;
        }

        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...config.headers,
        };

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          HTTP_REQUEST_TIMEOUT_MS
        );

        try {
          const response = await fetch(url, {
            method: config.method,
            headers,
            body:
              body && ["POST", "PUT", "PATCH"].includes(config.method)
                ? body
                : undefined,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          let responseData: unknown;
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          // Store response in variable if specified
          if (config.responseVariable) {
            const updatedVariables = {
              ...state.context.variables,
              [config.responseVariable]: responseData,
              [`${config.responseVariable}_status`]: response.status,
              [`${config.responseVariable}_ok`]: response.ok,
            };

            await updateConversationState(state.id, {
              context: {
                ...state.context,
                variables: updatedVariables,
              },
            });

            // Update local state
            state.context.variables = updatedVariables;
          }

          logger.debug("HTTP request completed", {
            method: config.method,
            url,
            status: response.status,
          });
        } catch (error) {
          clearTimeout(timeoutId);
          logger.error("HTTP request failed", error, {
            url,
            method: config.method,
          });

          // Store error in variable if specified
          if (config.responseVariable) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            const updatedVariables = {
              ...state.context.variables,
              [config.responseVariable]: null,
              [`${config.responseVariable}_error`]: errorMessage,
              [`${config.responseVariable}_ok`]: false,
            };

            await updateConversationState(state.id, {
              context: {
                ...state.context,
                variables: updatedVariables,
              },
            });

            state.context.variables = updatedVariables;
          }
        }
        break;
      }
      case "goto_node": {
        const config = action.config as { targetNodeId: string };
        const targetNode = flow.nodes.find((n) => n.id === config.targetNodeId);

        if (targetNode) {
          // Update current node pointer
          await updateConversationState(state.id, {
            context: {
              ...state.context,
              currentNodeId: config.targetNodeId,
            },
          });

          logger.debug("Goto node", { targetNodeId: config.targetNodeId });

          // Execute the target node immediately (with any collected responses)
          // Pass depth+1 and visitedNodes to detect circular references
          const gotoResult = await executeNode(
            targetNode,
            state,
            flow,
            flowContext,
            message,
            depth + 1,
            visitedNodes
          );

          // Combine responses if the goto target also has responses
          if (responses.length > 0 && gotoResult.response) {
            return {
              ...gotoResult,
              response: [...responses, gotoResult.response].join("\n"),
            };
          } else if (responses.length > 0) {
            return {
              ...gotoResult,
              response: responses.join("\n"),
            };
          }

          return gotoResult;
        } else {
          logger.warn("goto_node: Target node not found", {
            targetNodeId: config.targetNodeId,
          });
        }
        break;
      }
    }
  }

  if (node.type === "exit") {
    return {
      handled: true,
      response: responses.join("\n") || undefined,
    };
  }

  return {
    handled: responses.length > 0,
    response: responses.join("\n") || undefined,
  };
}

/**
 * Simple condition evaluation
 */
function evaluateCondition(
  expression: string,
  message: string,
  state: MetaConversationStateRow
): boolean {
  // Simple keyword matching for now
  // Format: "contains:keyword" or "equals:value" or "variable:name:value"
  const [type, ...rest] = expression.split(":");

  switch (type) {
    case "contains":
      return message.toLowerCase().includes(rest.join(":").toLowerCase());
    case "equals":
      return message.toLowerCase() === rest.join(":").toLowerCase();
    case "variable": {
      const [varName, varValue] = rest;
      if (!varName) return false;
      return state.context.variables[varName] === varValue;
    }
    default:
      return false;
  }
}
