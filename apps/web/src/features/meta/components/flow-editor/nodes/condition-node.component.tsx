/**
 * Condition Node Component
 *
 * Branches the flow based on user response
 */

import { GitBranch } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

/**
 * Renders a Condition node that displays the first condition's expression and Yes/No branch labels.
 *
 * @returns The JSX element representing the Condition node.
 */
export function ConditionNode({ id, data, selected }: FlowNodeProps) {
  const condition = data.conditions?.[0];
  const expression = condition?.expression || "";

  return (
    <BaseNode
      selected={selected}
      icon={<GitBranch className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.condition.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.condition.borderColor}
      title={data.name || "Condition"}
      hasSourceHandle={false}
      hasMultipleSources={true}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {expression || (
            <span className="italic">Click to set condition...</span>
          )}
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
          <span className="text-rose-600 dark:text-rose-400">No</span>
        </div>
      </div>
    </BaseNode>
  );
}