/**
 * Message Node Component
 *
 * Sends a simple text message
 */

import { MessageSquare } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type MessageNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function MessageNode({ id, data, selected }: MessageNodeProps) {
  const action = data.actions[0];
  const message = (action?.config?.message as string) || "";

  return (
    <BaseNode
      selected={selected}
      icon={<MessageSquare className="w-4 h-4" />}
      iconColor="bg-blue-500/20 text-blue-500"
      bgColor="bg-card"
      borderColor="ring-blue-500"
      title={data.name || "Send Message"}
      hasTargetHandle={true}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="text-sm text-muted-foreground line-clamp-3">
        {message || <span className="italic">Click to add message...</span>}
      </div>
    </BaseNode>
  );
}
