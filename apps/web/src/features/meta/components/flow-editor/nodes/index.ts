/**
 * Flow Editor Nodes - Index
 *
 * Export all custom node components and the node types map
 */

export { EntryNode } from "./entry-node.component";
export { MessageNode } from "./message-node.component";
export { QuickRepliesNode } from "./quick-replies-node.component";
export { CollectInputNode } from "./collect-input-node.component";
export { ConditionNode } from "./condition-node.component";
export { AiNode } from "./ai-node.component";
export { HandoffNode } from "./handoff-node.component";
export { DelayNode } from "./delay-node.component";
export { HttpRequestNode } from "./http-request-node.component";
export { SetVariableNode } from "./set-variable-node.component";
export { GotoNode } from "./goto-node.component";

import { EntryNode } from "./entry-node.component";
import { MessageNode } from "./message-node.component";
import { QuickRepliesNode } from "./quick-replies-node.component";
import { CollectInputNode } from "./collect-input-node.component";
import { ConditionNode } from "./condition-node.component";
import { AiNode } from "./ai-node.component";
import { HandoffNode } from "./handoff-node.component";
import { DelayNode } from "./delay-node.component";
import { HttpRequestNode } from "./http-request-node.component";
import { SetVariableNode } from "./set-variable-node.component";
import { GotoNode } from "./goto-node.component";

/**
 * Map of node type names to their React components
 * Used by ReactFlow to render custom nodes
 */
export const nodeTypes = {
  entry: EntryNode,
  message: MessageNode,
  "quick-replies": QuickRepliesNode,
  "collect-input": CollectInputNode,
  condition: ConditionNode,
  "ai-node": AiNode,
  handoff: HandoffNode,
  delay: DelayNode,
  "http-request": HttpRequestNode,
  "set-variable": SetVariableNode,
  goto: GotoNode,
} as const;
