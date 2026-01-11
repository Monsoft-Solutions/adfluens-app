/**
 * AI Response Node Component
 *
 * Lets AI generate an appropriate response based on context
 */

import { Sparkles } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function AiResponseNode({ id, data, selected }: FlowNodeProps) {
  return (
    <BaseNode
      selected={selected}
      icon={<Sparkles className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.aiResponse.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.aiResponse.borderColor}
      title={data.name || "AI Response"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="text-sm text-muted-foreground">
        AI will generate a contextual response based on the conversation.
      </div>
    </BaseNode>
  );
}
