/**
 * Flow Editor Types
 *
 * Type definitions for the visual flow editor using @xyflow/react
 */

import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// Node Types
// ============================================================================

export type FlowNodeType =
  | "entry"
  | "message"
  | "quick-replies"
  | "collect-input"
  | "condition"
  | "ai-response"
  | "handoff"
  | "delay";

// ============================================================================
// Action Types (from backend)
// ============================================================================

export type FlowActionType =
  | "send_message"
  | "send_quick_replies"
  | "collect_input"
  | "set_variable"
  | "handoff"
  | "goto_node"
  | "ai_response"
  | "delay";

export type FlowAction = {
  type: FlowActionType;
  config: Record<string, unknown>;
};

// ============================================================================
// Trigger Types (from backend)
// ============================================================================

export type FlowTriggerType = "keyword" | "intent" | "regex" | "event";

export type FlowTriggerMatchMode =
  | "exact"
  | "contains"
  | "starts_with"
  | "ends_with";

export type FlowTrigger = {
  type: FlowTriggerType;
  value: string;
  matchMode?: FlowTriggerMatchMode;
  caseSensitive?: boolean;
};

// ============================================================================
// Condition Types
// ============================================================================

export type FlowCondition = {
  expression: string;
  targetNodeId: string;
};

// ============================================================================
// API Node Type (what backend expects/returns)
// ============================================================================

export type ApiFlowNode = {
  id: string;
  name: string;
  type: "entry" | "message" | "condition" | "action" | "ai_node" | "exit";
  actions: FlowAction[];
  triggers?: FlowTrigger[];
  conditions?: FlowCondition[];
  nextNodes?: string[];
  position?: { x: number; y: number };
};

// ============================================================================
// React Flow Node Data
// ============================================================================

export type FlowNodeData = {
  name: string;
  nodeType: FlowNodeType;
  actions: FlowAction[];
  triggers?: FlowTrigger[];
  conditions?: FlowCondition[];
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
};

// React Flow node with our custom data
export type FlowEditorNode = Node<FlowNodeData, FlowNodeType>;

// React Flow edge
export type FlowEditorEdge = Edge;

// ============================================================================
// Flow Editor Props
// ============================================================================

export type FlowEditorProps = {
  flowId?: string; // If editing existing flow
  pageId: string;
  initialNodes?: ApiFlowNode[];
  initialTriggers?: FlowTrigger[];
  initialName?: string;
  initialDescription?: string;
  isActive?: boolean;
  /** Save handler - onComplete callback is called when save finishes (success or error) to reset loading state */
  onSave: (data: FlowSaveData, onComplete?: () => void) => void;
  onCancel: () => void;
};

export type FlowSaveData = {
  name: string;
  description?: string;
  nodes: ApiFlowNode[];
  entryNodeId: string;
  globalTriggers: FlowTrigger[];
  isActive: boolean;
};

// ============================================================================
// Node Palette Item
// ============================================================================

export type NodePaletteItem = {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "messages" | "logic" | "actions";
  defaultData: Partial<FlowNodeData>;
};

// ============================================================================
// Conversion Helpers
// ============================================================================

/**
 * Map our visual node type to backend node type
 */
export const nodeTypeToApiType: Record<FlowNodeType, ApiFlowNode["type"]> = {
  entry: "entry",
  message: "message",
  "quick-replies": "message",
  "collect-input": "message",
  condition: "condition",
  "ai-response": "ai_node",
  handoff: "action",
  delay: "action",
};

/**
 * Map backend node type to our visual node type based on action
 */
export function apiTypeToNodeType(apiNode: ApiFlowNode): FlowNodeType {
  const action = apiNode.actions[0];

  if (apiNode.type === "entry") return "entry";
  if (apiNode.type === "condition") return "condition";
  if (apiNode.type === "ai_node") return "ai-response";

  if (action) {
    switch (action.type) {
      case "send_quick_replies":
        return "quick-replies";
      case "collect_input":
        return "collect-input";
      case "handoff":
        return "handoff";
      case "ai_response":
        return "ai-response";
      case "delay":
        return "delay";
    }
  }

  return "message";
}
