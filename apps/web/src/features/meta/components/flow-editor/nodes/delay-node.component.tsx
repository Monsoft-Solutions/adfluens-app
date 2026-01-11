/**
 * Delay Node Component
 *
 * Pauses flow execution for a specified duration before continuing
 */

import { Clock } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type DelayNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function DelayNode({ id, data, selected }: DelayNodeProps) {
  const action = data.actions[0];
  const amount = (action?.config?.delayAmount as number) || 1;
  const unit = (action?.config?.delayUnit as string) || "days";

  // Format the display text
  const formatDelay = () => {
    const unitLabel = amount === 1 ? unit.slice(0, -1) : unit;
    return `${amount} ${unitLabel}`;
  };

  return (
    <BaseNode
      selected={selected}
      icon={<Clock className="w-4 h-4" />}
      iconColor="bg-amber-500/20 text-amber-500"
      bgColor="bg-card"
      borderColor="ring-amber-500"
      title={data.name || "Wait"}
      hasTargetHandle={true}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Wait{" "}
          <span className="font-medium text-foreground">{formatDelay()}</span>{" "}
          before continuing
        </div>
        <div className="text-xs text-muted-foreground/70">
          Flow pauses until the delay expires
        </div>
      </div>
    </BaseNode>
  );
}
