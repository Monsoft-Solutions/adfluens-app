/**
 * Field Types
 *
 * Shared types for node field components in the properties panel.
 */

import type { FlowNodeData, FlowEditorNode } from "../flow-editor.types";

/**
 * Common props for all node field components.
 * Used by the properties panel to edit node data.
 */
export type NodeFieldProps = {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
  /** All nodes in the flow - used for variable picker and node selectors */
  nodes: FlowEditorNode[];
};
