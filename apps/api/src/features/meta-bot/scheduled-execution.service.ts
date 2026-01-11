/**
 * Scheduled Execution Service
 *
 * Handles scheduling, cancellation, and processing of delayed flow node executions.
 * Uses a cron job to periodically check for due executions and resume flows.
 */

import {
  db,
  eq,
  and,
  lte,
  metaFlowScheduledExecutionTable,
  metaConversationStateTable,
  metaBotFlowTable,
  metaPageTable,
  metaConversationTable,
} from "@repo/db";
import type {
  MetaFlowScheduledExecutionInsert,
  MetaConversationStateRow,
  MetaConversationContext,
  MetaBotFlowRow,
} from "@repo/db";
import { sendMessage as sendMetaMessage } from "../meta/meta-api.utils";

// =============================================================================
// Types
// =============================================================================

export type ScheduleExecutionParams = {
  organizationId: string;
  metaPageId: string;
  conversationId: string;
  flowId: string;
  nextNodeId: string;
  delayAmount: number;
  delayUnit: "minutes" | "hours" | "days";
  conversationContext: MetaConversationContext;
};

// =============================================================================
// Scheduling Functions
// =============================================================================

/**
 * Calculate delay in milliseconds
 */
function calculateDelayMs(
  amount: number,
  unit: "minutes" | "hours" | "days"
): number {
  switch (unit) {
    case "minutes":
      return amount * 60 * 1000;
    case "hours":
      return amount * 60 * 60 * 1000;
    case "days":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return amount * 60 * 1000; // Default to minutes
  }
}

/**
 * Schedule a flow node execution after a delay
 */
export async function scheduleFlowExecution(
  params: ScheduleExecutionParams
): Promise<string> {
  const delayMs = calculateDelayMs(params.delayAmount, params.delayUnit);
  const scheduledFor = new Date(Date.now() + delayMs);

  const [execution] = await db
    .insert(metaFlowScheduledExecutionTable)
    .values({
      organizationId: params.organizationId,
      metaPageId: params.metaPageId,
      conversationId: params.conversationId,
      flowId: params.flowId,
      nextNodeId: params.nextNodeId,
      scheduledFor,
      conversationContext: params.conversationContext,
      status: "pending",
    } satisfies MetaFlowScheduledExecutionInsert)
    .returning();

  if (!execution) {
    throw new Error("Failed to schedule flow execution");
  }

  console.log(
    `[scheduled-execution] Scheduled execution ${execution.id} for ${scheduledFor.toISOString()}`
  );

  return execution.id;
}

/**
 * Cancel all pending scheduled executions for a conversation
 * Called when a user sends a new message during a delay
 */
export async function cancelPendingExecutions(
  conversationId: string
): Promise<number> {
  const result = await db
    .update(metaFlowScheduledExecutionTable)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(metaFlowScheduledExecutionTable.conversationId, conversationId),
        eq(metaFlowScheduledExecutionTable.status, "pending")
      )
    )
    .returning({ id: metaFlowScheduledExecutionTable.id });

  if (result.length > 0) {
    console.log(
      `[scheduled-execution] Cancelled ${result.length} pending executions for conversation ${conversationId}`
    );
  }

  return result.length;
}

/**
 * Cancel all pending scheduled executions for a flow
 * Called when a flow is deactivated
 */
export async function cancelPendingExecutionsForFlow(
  flowId: string
): Promise<number> {
  const result = await db
    .update(metaFlowScheduledExecutionTable)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(metaFlowScheduledExecutionTable.flowId, flowId),
        eq(metaFlowScheduledExecutionTable.status, "pending")
      )
    )
    .returning({ id: metaFlowScheduledExecutionTable.id });

  if (result.length > 0) {
    console.log(
      `[scheduled-execution] Cancelled ${result.length} pending executions for flow ${flowId}`
    );
  }

  return result.length;
}

// =============================================================================
// Execution Processor
// =============================================================================

/**
 * Process all due scheduled executions
 * Called by cron job every minute
 */
export async function processScheduledExecutions(): Promise<void> {
  const now = new Date();

  // Find due executions
  const dueExecutions = await db.query.metaFlowScheduledExecutionTable.findMany(
    {
      where: and(
        eq(metaFlowScheduledExecutionTable.status, "pending"),
        lte(metaFlowScheduledExecutionTable.scheduledFor, now)
      ),
      limit: 100, // Process in batches
    }
  );

  if (dueExecutions.length === 0) {
    return;
  }

  console.log(
    `[scheduled-execution] Processing ${dueExecutions.length} due executions`
  );

  for (const execution of dueExecutions) {
    try {
      await processExecution(execution.id);
    } catch (error) {
      console.error(
        `[scheduled-execution] Failed to process execution ${execution.id}:`,
        error
      );
    }
  }
}

/**
 * Process a single scheduled execution
 */
async function processExecution(executionId: string): Promise<void> {
  // Atomically claim the execution by updating status to "processing"
  // Only if current status is "pending" (prevents race condition with multiple workers)
  const [claimed] = await db
    .update(metaFlowScheduledExecutionTable)
    .set({
      status: "processing",
      attempts: 1, // TODO: Implement retry logic
    })
    .where(
      and(
        eq(metaFlowScheduledExecutionTable.id, executionId),
        eq(metaFlowScheduledExecutionTable.status, "pending")
      )
    )
    .returning({ id: metaFlowScheduledExecutionTable.id });

  // If no rows were updated, another worker already claimed this execution
  if (!claimed) {
    console.log(
      `[scheduled-execution] Execution ${executionId} already claimed by another worker or not pending`
    );
    return;
  }

  const execution = await db.query.metaFlowScheduledExecutionTable.findFirst({
    where: eq(metaFlowScheduledExecutionTable.id, executionId),
  });

  if (!execution) {
    console.error(`[scheduled-execution] Execution ${executionId} not found`);
    return;
  }

  try {
    // Get the flow
    const flow = await db.query.metaBotFlowTable.findFirst({
      where: eq(metaBotFlowTable.id, execution.flowId),
    });

    if (!flow || !flow.isActive) {
      console.log(
        `[scheduled-execution] Flow ${execution.flowId} not found or inactive, marking as cancelled`
      );
      await markExecutionStatus(executionId, "cancelled");
      return;
    }

    // Get conversation state
    const state = await db.query.metaConversationStateTable.findFirst({
      where: eq(
        metaConversationStateTable.metaConversationId,
        execution.conversationId
      ),
    });

    if (!state) {
      console.log(
        `[scheduled-execution] Conversation state not found for ${execution.conversationId}`
      );
      await markExecutionStatus(
        executionId,
        "failed",
        "Conversation state not found"
      );
      return;
    }

    // Check if still in flow mode and on the expected flow
    if (
      state.botMode !== "flow" ||
      state.context.currentFlowId !== execution.flowId
    ) {
      console.log(
        `[scheduled-execution] Conversation is no longer in the expected flow, marking as cancelled`
      );
      await markExecutionStatus(executionId, "cancelled");
      return;
    }

    // Find the next node
    const nextNode = flow.nodes.find((n) => n.id === execution.nextNodeId);
    if (!nextNode) {
      console.log(
        `[scheduled-execution] Next node ${execution.nextNodeId} not found in flow`
      );
      await markExecutionStatus(executionId, "failed", "Next node not found");
      return;
    }

    // Restore conversation context
    const restoredContext: MetaConversationContext = {
      ...state.context,
      ...(execution.conversationContext || {}),
      currentNodeId: execution.nextNodeId,
    };

    // Update conversation state with restored context
    await db
      .update(metaConversationStateTable)
      .set({
        context: restoredContext,
      })
      .where(eq(metaConversationStateTable.id, state.id));

    // Execute the node
    const response = await executeScheduledNode(
      nextNode,
      { ...state, context: restoredContext },
      flow,
      execution
    );

    // Mark as completed
    await markExecutionStatus(executionId, "completed");

    console.log(
      `[scheduled-execution] Successfully processed execution ${executionId}`
    );

    // If node produced a response, send it
    if (response) {
      await sendDelayedResponse(execution, response);
    }
  } catch (error) {
    console.error(
      `[scheduled-execution] Error processing execution ${executionId}:`,
      error
    );
    await markExecutionStatus(
      executionId,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Execute a scheduled node and return response
 */
async function executeScheduledNode(
  node: MetaBotFlowRow["nodes"][0],
  state: MetaConversationStateRow,
  flow: MetaBotFlowRow,
  execution: {
    conversationId: string;
    organizationId: string;
    metaPageId: string;
    flowId: string;
  }
): Promise<string | null> {
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
        break;
      }
      case "handoff": {
        // Handle handoff
        responses.push(
          "I'll connect you with a team member who can help you better."
        );
        await db
          .update(metaConversationStateTable)
          .set({
            botMode: "human",
            context: {
              ...state.context,
              handoffReason:
                (action.config.reason as string) || "scheduled_handoff",
            },
          })
          .where(eq(metaConversationStateTable.id, state.id));
        break;
      }
      case "delay": {
        // Another delay - schedule the next node
        const amount = (action.config.delayAmount as number) || 1;
        const unit =
          (action.config.delayUnit as "minutes" | "hours" | "days") || "days";

        if (node.nextNodes?.length) {
          await scheduleFlowExecution({
            organizationId: execution.organizationId,
            metaPageId: execution.metaPageId,
            conversationId: execution.conversationId,
            flowId: execution.flowId,
            nextNodeId: node.nextNodes[0]!,
            delayAmount: amount,
            delayUnit: unit,
            conversationContext: state.context,
          });
        }
        return responses.join("\n") || null;
      }
    }
  }

  // Move to next node if available
  if (node.nextNodes?.length) {
    const nextNode = flow.nodes.find((n) => n.id === node.nextNodes![0]);
    if (nextNode) {
      await db
        .update(metaConversationStateTable)
        .set({
          context: {
            ...state.context,
            currentNodeId: nextNode.id,
          },
        })
        .where(eq(metaConversationStateTable.id, state.id));

      // If next node is not a delay, execute it immediately
      if (!nextNode.actions.some((a) => a.type === "delay")) {
        const nextResponse = await executeScheduledNode(
          nextNode,
          state,
          flow,
          execution
        );
        if (nextResponse) {
          responses.push(nextResponse);
        }
      }
    }
  } else {
    // End of flow
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

    // Increment completion count
    await db
      .update(metaBotFlowTable)
      .set({ completionCount: flow.completionCount + 1 })
      .where(eq(metaBotFlowTable.id, flow.id));
  }

  return responses.join("\n") || null;
}

/**
 * Send the delayed response to the user
 */
async function sendDelayedResponse(
  execution: {
    conversationId: string;
    metaPageId: string;
    organizationId: string;
  },
  message: string
): Promise<void> {
  try {
    // Get page for access token
    const page = await db.query.metaPageTable.findFirst({
      where: eq(metaPageTable.id, execution.metaPageId),
    });

    if (!page) {
      console.error(
        `[scheduled-execution] Page ${execution.metaPageId} not found`
      );
      return;
    }

    // Get conversation for participant ID
    const conversation = await db.query.metaConversationTable.findFirst({
      where: eq(metaConversationTable.id, execution.conversationId),
    });

    if (!conversation) {
      console.error(
        `[scheduled-execution] Conversation ${execution.conversationId} not found`
      );
      return;
    }

    // Send message via Meta API
    await sendMetaMessage(
      page.pageId,
      page.pageAccessToken,
      conversation.participantId,
      message
    );

    console.log(
      `[scheduled-execution] Sent delayed message to conversation ${execution.conversationId}`
    );
  } catch (error) {
    console.error(
      `[scheduled-execution] Failed to send delayed message:`,
      error
    );
  }
}

/**
 * Update execution status
 */
async function markExecutionStatus(
  executionId: string,
  status: "completed" | "failed" | "cancelled",
  error?: string
): Promise<void> {
  await db
    .update(metaFlowScheduledExecutionTable)
    .set({
      status,
      lastError: error,
      processedAt: new Date(),
    })
    .where(eq(metaFlowScheduledExecutionTable.id, executionId));
}
