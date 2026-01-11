/**
 * Go To Node Component
 *
 * Jumps to another node in the flow (terminal node - no output handle)
 */

import { CornerDownRight } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getGotoConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function GotoNode({ id, data, selected }: FlowNodeProps) {
  const { targetNodeId } = getGotoConfig(data);

  return (
    <BaseNode
      selected={selected}
      icon={<CornerDownRight className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.goto.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.goto.borderColor}
      title={data.name || "Go To"}
      hasSourceHandle={false}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        {targetNodeId ? (
          <>
            <div className="text-sm">
              Jump to:{" "}
              <span className="font-medium text-pink-500">{targetNodeId}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Flow continues at target node
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Select target node to jump to
          </div>
        )}
      </div>
    </BaseNode>
  );
}
