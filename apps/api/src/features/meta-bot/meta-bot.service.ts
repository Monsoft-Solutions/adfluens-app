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
} from "@repo/db";
import {
  detectIntent,
  generateAiResponse,
  shouldTriggerHandoff,
  checkResponseRules,
  isWithinBusinessHours,
  buildBusinessContext,
} from "./meta-bot-ai.service";
import { notifyHandoffRequest } from "../meta/meta-notification.service";
import {
  scheduleFlowExecution,
  cancelPendingExecutions,
} from "./scheduled-execution.service";

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
 * Process an incoming user message and determine the bot's next action.
 *
 * May run response rules, continue or start flows, detect intent, evaluate handoff triggers,
 * generate an AI response, update conversation state, cancel or schedule flow executions,
 * and initiate human handoff notifications when required.
 *
 * @returns A BotResponse describing the outcome:
 * - `handled: true` when the message produced a bot/flow/rule/away/handoff response (includes `response` and optional `updatedContext`).
 * - `shouldHandoff: true` when a human handoff was initiated; `handoffReason` contains the trigger reason.
 * - `handled: false` when processing was bypassed or failed (e.g., AI disabled, human handling, outside business hours, or AI error); `reason` indicates the cause.
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

  // 3. Check if human is handling (bypass bot)
  if (state.botMode === "human") {
    return { handled: false, reason: "human_handling" };
  }

  // 4. Check business hours
  if (!isWithinBusinessHours(config.businessHours)) {
    if (config.awayMessage) {
      return {
        handled: true,
        response: config.awayMessage,
        reason: "away_message",
      };
    }
    return { handled: false, reason: "outside_business_hours" };
  }

  // 5. Check custom response rules (highest priority)
  const ruleResponse = checkResponseRules(message, config.responseRules);
  if (ruleResponse) {
    return { handled: true, response: ruleResponse, reason: "response_rule" };
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
    return {
      handled: true,
      shouldHandoff: true,
      handoffReason: handoffCheck.reason,
      response:
        "I'll connect you with a team member who can help you better. Someone will be with you shortly!",
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
    });

    // Update conversation state if needed
    if (aiResult.updatedContext) {
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          ...aiResult.updatedContext,
          lastUserMessage: message,
          lastAiResponse: aiResult.response,
        },
        lastUserMessageAt: new Date(),
        lastBotResponseAt: new Date(),
      });
    } else {
      await updateConversationState(state.id, {
        context: {
          ...state.context,
          lastUserMessage: message,
          lastAiResponse: aiResult.response,
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
      response: aiResult.response,
      reason: `ai_${intent.category}`,
      updatedContext: aiResult.updatedContext,
    };
  } catch (error) {
    console.error("[meta-bot] AI response generation failed:", error);
    return { handled: false, reason: "ai_error" };
  }
}

// =============================================================================
// Conversation Config
// =============================================================================

/**
 * Retrieve the conversation configuration for a page, optionally scoped to a specific organization.
 *
 * @param pageId - The meta page ID to look up the configuration for
 * @param organizationId - Optional organization ID to restrict the lookup to an organization-specific config
 * @returns The configuration row for the page if found, otherwise `null`
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
 * Creates and persists a default conversation configuration for the given page and organization.
 *
 * @param pageId - ID of the page to associate the configuration with
 * @param organizationId - ID of the organization that owns the page
 * @returns The newly inserted conversation configuration row
 * @throws Error if the configuration could not be created
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
 * Retrieve the conversation state for a conversation, creating a new initial state if none exists.
 *
 * @param conversationId - The meta conversation identifier to look up or initialize
 * @param organizationId - Organization ID to associate with a newly created state
 * @returns The existing or newly created conversation state row
 * @throws Error if inserting a new conversation state fails
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
 * Apply partial updates to a conversation state record identified by `stateId`.
 *
 * @param stateId - The ID of the conversation state to update
 * @param updates - Partial fields to persist to the conversation state row
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
 * Mark the conversation as being handled by a human operator.
 *
 * @param conversationId - The meta conversation ID to mark as human-handled
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
 * Set a conversation back to bot handling mode and clear any active flow pointers.
 *
 * @param conversationId - The meta conversation ID to update
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
 * Mark a conversation for human handling and notify the team.
 *
 * Updates the conversation state to human mode with a recorded handoff reason, creates or reopens a team inbox item for the conversation with the appropriate handoff trigger, and sends a handoff notification for the conversation's page.
 *
 * @param reason - The reason for initiating the handoff (e.g., "user_request", contains "keyword" for keyword-triggered handoffs, or other descriptors such as "sentiment")
 * @param _participantName - Optional participant name for the handoff; may be unused by the current implementation
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
 * Selects the highest-priority active flow for a page whose global triggers match the message.
 *
 * Matching supports keyword triggers (match modes: `exact`, `starts_with`, `ends_with`, `contains`) and regex triggers; keyword matching respects each trigger's case sensitivity. If a flow matches, its `triggerCount` is incremented.
 *
 * @returns The matching flow row, or `null` if no flow matched the message
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
        // Increment trigger count
        await db
          .update(metaBotFlowTable)
          .set({ triggerCount: flow.triggerCount + 1 })
          .where(eq(metaBotFlowTable.id, flow.id));

        return flow;
      }
    }
  }

  return null;
}

/**
 * Sets the conversation into flow mode, records the flow's entry node in state, and executes that entry node.
 *
 * @param state - Current conversation state to update (will be set to flow mode and annotated with flow/node IDs)
 * @param flow - Flow to start; its entry node will be executed
 * @param _message - Incoming message that triggered the flow (currently unused)
 * @param context - Execution context for flow node execution
 * @returns A BotResponse produced by executing the flow's entry node, or `{ handled: false, reason: "invalid_flow" }` if the entry node is missing
 */
async function startFlow(
  state: MetaConversationStateRow,
  flow: MetaBotFlowRow,
  _message: string,
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

  return executeNode(entryNode, state, flow, context);
}

/**
 * Advance and execute the current flow node for a conversation, resolving conditional or default transitions.
 *
 * Updates conversation state as it advances nodes, may switch bot mode when the flow exits, and increments the flow's completion count when finished.
 *
 * @param state - Current conversation state containing flow and node identifiers
 * @param message - Incoming message text used for condition evaluation
 * @param config - Conversation configuration that controls fallback behavior when the flow ends
 * @param flowContext - Execution context used for scheduling or delayed node execution
 * @returns A BotResponse describing whether the flow produced a handled response, requested a handoff, scheduled a delay, or did not handle the message (`handled: false`)
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
          return executeNode(nextNode, state, flow, flowContext);
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
      return executeNode(nextNode, state, flow, flowContext);
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

  // Increment completion count
  await db
    .update(metaBotFlowTable)
    .set({ completionCount: flow.completionCount + 1 })
    .where(eq(metaBotFlowTable.id, flow.id));

  return { handled: false };
}

/**
 * Execute a single flow node's actions and produce the resulting BotResponse.
 *
 * Executes the node's actions in order, collecting any messages to return, scheduling delayed transitions,
 * and signalling handoff or AI fallback when applicable.
 *
 * @param node - The flow node to execute (contains actions, type, and nextNodes)
 * @param state - Current conversation state and context; used when scheduling delayed executions
 * @param flow - The parent flow containing the node (used to identify flow and nodes for scheduling)
 * @param flowContext - Execution context with organizationId, metaPageId, and conversationId
 * @returns A BotResponse describing whether the node produced messages (`response`), whether it was handled,
 *          and any special signals: `shouldHandoff`/`handoffReason` for handoff, or `reason: "ai_fallback"` for AI fallback.
 */
async function executeNode(
  node: MetaBotFlowRow["nodes"][0],
  state: MetaConversationStateRow,
  flow: MetaBotFlowRow,
  flowContext: FlowExecutionContext
): Promise<BotResponse> {
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
      case "ai_response": {
        // Signal to fall back to AI
        return { handled: false, reason: "ai_fallback" };
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

          console.log(
            `[meta-bot] Scheduled delay: ${delayAmount} ${delayUnit} for conversation ${flowContext.conversationId}`
          );
        }

        // Return with any message that was collected before the delay
        return {
          handled: true,
          response: responses.join("\n") || undefined,
          reason: "flow_delay_scheduled",
        };
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
 * Evaluate a simple matching expression against an incoming message and conversation state.
 *
 * Supported expression formats:
 * - `contains:keyword` — case-insensitive substring match against `message`
 * - `equals:value` — case-insensitive equality match against `message`
 * - `variable:name:value` — strict equality check of `state.context.variables[name]` to `value`
 *
 * @param expression - The match expression to evaluate (see supported formats)
 * @param message - The incoming message text to test for `contains`/`equals` expressions
 * @param state - Conversation state used for `variable` lookups
 * @returns `true` if the expression matches the message or state, `false` otherwise.
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