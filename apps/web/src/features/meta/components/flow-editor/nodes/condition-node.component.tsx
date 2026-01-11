/**
 * Condition Node Component
 *
 * Branches the flow based on user response
 */

import { GitBranch } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type ConditionNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function ConditionNode({ id, data, selected }: ConditionNodeProps) {
  const condition = data.conditions?.[0];
  const expression = condition?.expression || "";

  return (
    <BaseNode
      selected={selected}
      icon={<GitBranch className="w-4 h-4" />}
      iconColor="bg-orange-500/20 text-orange-500"
      bgColor="bg-card"
      borderColor="ring-orange-500"
      title={data.name || "Condition"}
      hasTargetHandle={true}
      hasSourceHandle={false}
      hasMultipleSources={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {expression || (
            <span className="italic">Click to set condition...</span>
          )}
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-500">Yes</span>
          <span className="text-red-500">No</span>
        </div>
      </div>
    </BaseNode>
  );
}
