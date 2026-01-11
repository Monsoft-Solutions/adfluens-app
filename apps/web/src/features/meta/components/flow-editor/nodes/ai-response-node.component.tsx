/**
 * AI Response Node Component
 *
 * Lets AI generate an appropriate response based on context
 */

import { Sparkles } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type AiResponseNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function AiResponseNode({ id, data, selected }: AiResponseNodeProps) {
  return (
    <BaseNode
      selected={selected}
      icon={<Sparkles className="w-4 h-4" />}
      iconColor="bg-cyan-500/20 text-cyan-500"
      bgColor="bg-card"
      borderColor="ring-cyan-500"
      title={data.name || "AI Response"}
      hasTargetHandle={true}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="text-sm text-muted-foreground">
        AI will generate a contextual response based on the conversation.
      </div>
    </BaseNode>
  );
}
