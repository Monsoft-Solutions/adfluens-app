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
  | "ai-node"
  | "handoff"
  | "delay"
  | "http-request"
  | "set-variable"
  | "goto";

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
  | "ai_node"
  | "delay"
  | "http_request";

// ============================================================================
// Action Config Types (for type-safe config access)
// ============================================================================

export type MessageActionConfig = {
  message: string;
};

export type QuickRepliesActionConfig = {
  message: string;
  replies: string[];
};

export type CollectInputActionConfig = {
  prompt: string;
  inputName: string;
};

export type HandoffActionConfig = {
  reason: string;
};

export type DelayActionConfig = {
  delayAmount: number;
  delayUnit: "minutes" | "hours" | "days";
};

export type SetVariableActionConfig = {
  variableName: string;
  value: unknown;
};

export type GotoNodeActionConfig = {
  targetNodeId: string;
};

// ============================================================================
// AI Node Types
// ============================================================================

/**
 * AI Node operation types
 */
export type AiNodeOperation =
  | "generate_response" // Conversational response (default, backward compatible)
  | "generate_content" // Generate text with custom prompt
  | "extract_data" // Extract structured data to variables
  | "classify_intent" // Classify message with custom categories
  | "analyze_sentiment" // Analyze sentiment
  | "summarize" // Summarize text
  | "translate" // Translate content
  | "custom"; // Full custom prompt with schema

/**
 * Available AI models
 */
export type AiNodeModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano";

/**
 * Field definition for extract_data operation
 */
export type ExtractedField = {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  description: string;
  required?: boolean;
};

/**
 * AI Node action configuration
 */
export type AiNodeActionConfig = {
  // Operation type (defaults to generate_response for backward compatibility)
  operation?: AiNodeOperation;

  // Common options
  outputVariable?: string; // Store result in this variable
  sendAsMessage?: boolean; // Send result as message (default: true for generate_*)

  // Prompt customization
  customSystemPrompt?: string; // Override default system prompt
  customUserPrompt?: string; // Template for user prompt with {{variables}}

  // Model settings
  model?: AiNodeModel;
  temperature?: number; // 0.0-1.0

  // Operation-specific config
  extractionSchema?: ExtractedField[]; // For extract_data
  extractionSchemaJson?: string; // Raw JSON schema for power users
  classificationCategories?: string[]; // For classify_intent
  targetLanguage?: string; // For translate
};

export type HttpRequestActionConfig = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  responseVariable?: string;
};

// Discriminated union for type-safe action handling
export type FlowAction =
  | { type: "send_message"; config: MessageActionConfig }
  | { type: "send_quick_replies"; config: QuickRepliesActionConfig }
  | { type: "collect_input"; config: CollectInputActionConfig }
  | { type: "handoff"; config: HandoffActionConfig }
  | { type: "delay"; config: DelayActionConfig }
  | { type: "set_variable"; config: SetVariableActionConfig }
  | { type: "goto_node"; config: GotoNodeActionConfig }
  | { type: "ai_node"; config: AiNodeActionConfig }
  | { type: "http_request"; config: HttpRequestActionConfig };

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

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

export type SingleCondition = {
  variable: string;
  operator: ConditionOperator;
  value: string;
};

export type FlowConditionGroup = {
  logic: "and" | "or";
  conditions: SingleCondition[];
};

// Keep legacy support for simple expression-based conditions
export type FlowCondition = {
  expression?: string;
  conditionGroup?: FlowConditionGroup;
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
  onDelete?: (nodeId: string) => void;
};

// React Flow node with our custom data
export type FlowEditorNode = Node<FlowNodeData, FlowNodeType>;

// React Flow edge
export type FlowEditorEdge = Edge;

// Shared props type for all flow node components (DRY)
export type FlowNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

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
  "ai-node": "ai_node",
  handoff: "action",
  delay: "action",
  "http-request": "action",
  "set-variable": "action",
  goto: "action",
};

/**
 * Map backend node type to our visual node type based on action
 */
export function apiTypeToNodeType(apiNode: ApiFlowNode): FlowNodeType {
  const action = apiNode.actions[0];

  if (apiNode.type === "entry") return "entry";
  if (apiNode.type === "condition") return "condition";
  if (apiNode.type === "ai_node") return "ai-node";

  if (action) {
    switch (action.type) {
      case "send_quick_replies":
        return "quick-replies";
      case "collect_input":
        return "collect-input";
      case "handoff":
        return "handoff";
      case "ai_node":
        return "ai-node";
      case "delay":
        return "delay";
      case "http_request":
        return "http-request";
      case "set_variable":
        return "set-variable";
      case "goto_node":
        return "goto";
    }
  }

  return "message";
}
