/**
 * Handoff Node Component
 *
 * Transfers the conversation to a human agent
 */

import { UserCheck } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getHandoffConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function HandoffNode({ id, data, selected }: FlowNodeProps) {
  const { reason } = getHandoffConfig(data);

  return (
    <BaseNode
      selected={selected}
      icon={<UserCheck className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.handoff.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.handoff.borderColor}
      title={data.name || "Handoff"}
      hasSourceHandle={false}
      onDelete={getNodeDeleteHandler(data, id)}
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
