/**
 * Node Utilities
 *
 * Shared utilities for flow editor node components to eliminate code duplication.
 */

import type {
  FlowNodeData,
  FlowAction,
  MessageActionConfig,
  QuickRepliesActionConfig,
  CollectInputActionConfig,
  HandoffActionConfig,
  DelayActionConfig,
} from "../flow-editor.types";

// ============================================================================
// Delete Handler
// ============================================================================

/**
 * Creates an onDelete handler for node components.
 * Eliminates the repeated pattern: data.onDelete ? () => data.onDelete?.(id) : undefined
 */
export const getNodeDeleteHandler = (
  data: FlowNodeData,
  id: string
): (() => void) | undefined =>
  data.onDelete ? () => data.onDelete?.(id) : undefined;

// ============================================================================
// Action Config Extraction
// ============================================================================

/**
 * Safely extracts the first action from node data.
 */
export const getFirstAction = (data: FlowNodeData): FlowAction | undefined =>
  data.actions[0];

/**
 * Type-safe config extraction for message nodes.
 */
export const getMessageConfig = (data: FlowNodeData): MessageActionConfig => {
  const action = getFirstAction(data);
  if (action?.type === "send_message") {
    return action.config;
  }
  return { message: "" };
};

/**
 * Type-safe config extraction for quick replies nodes.
 */
export const getQuickRepliesConfig = (
  data: FlowNodeData
): QuickRepliesActionConfig => {
  const action = getFirstAction(data);
  if (action?.type === "send_quick_replies") {
    return action.config;
  }
  return { message: "", replies: [] };
};

/**
 * Type-safe config extraction for collect input nodes.
 */
export const getCollectInputConfig = (
  data: FlowNodeData
): CollectInputActionConfig => {
  const action = getFirstAction(data);
  if (action?.type === "collect_input") {
    return action.config;
  }
  return { prompt: "", inputName: "" };
};

/**
 * Type-safe config extraction for handoff nodes.
 */
export const getHandoffConfig = (data: FlowNodeData): HandoffActionConfig => {
  const action = getFirstAction(data);
  if (action?.type === "handoff") {
    return action.config;
  }
  return { reason: "" };
};

/**
 * Type-safe config extraction for delay nodes.
 */
export const getDelayConfig = (data: FlowNodeData): DelayActionConfig => {
  const action = getFirstAction(data);
  if (action?.type === "delay") {
    return action.config;
  }
  return { delayAmount: 1, delayUnit: "days" };
};

// ============================================================================
// Styling Constants
// ============================================================================

/**
 * Shared icon size class for consistency across all nodes.
 */
export const NODE_ICON_SIZE = "w-4 h-4";

/**
 * Common node styling configurations.
 * Colors match the original node component implementations.
 */
export const NODE_STYLES = {
  message: {
    iconColor: "bg-blue-500/20 text-blue-500",
    borderColor: "ring-blue-500",
  },
  quickReplies: {
    iconColor: "bg-blue-500/20 text-blue-500",
    borderColor: "ring-blue-500",
  },
  collectInput: {
    iconColor: "bg-purple-500/20 text-purple-500",
    borderColor: "ring-purple-500",
  },
  condition: {
    iconColor: "bg-orange-500/20 text-orange-500",
    borderColor: "ring-orange-500",
  },
  aiResponse: {
    iconColor: "bg-cyan-500/20 text-cyan-500",
    borderColor: "ring-cyan-500",
  },
  handoff: {
    iconColor: "bg-red-500/20 text-red-500",
    borderColor: "ring-red-500",
  },
  delay: {
    iconColor: "bg-amber-500/20 text-amber-500",
    borderColor: "ring-amber-500",
  },
  entry: {
    iconColor: "bg-green-500/20 text-green-500",
    borderColor: "ring-green-500",
  },
} as const;
