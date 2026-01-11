/**
 * Handoff Node Component
 *
 * Transfers the conversation to a human agent
 */

import { UserCheck } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type HandoffNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function HandoffNode({ id, data, selected }: HandoffNodeProps) {
  const action = data.actions[0];
  const reason = (action?.config?.reason as string) || "";

  return (
    <BaseNode
      selected={selected}
      icon={<UserCheck className="w-4 h-4" />}
      iconColor="bg-red-500/20 text-red-500"
      bgColor="bg-card"
      borderColor="ring-red-500"
      title={data.name || "Handoff"}
      hasTargetHandle={true}
      hasSourceHandle={false}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Transfer to human agent
        </div>
        {reason && (
          <Badge variant="outline" className="text-xs">
            Reason: {reason}
          </Badge>
        )}
      </div>
    </BaseNode>
  );
}
