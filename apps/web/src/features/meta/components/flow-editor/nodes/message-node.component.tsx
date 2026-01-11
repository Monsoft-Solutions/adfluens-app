/**
 * Message Node Component
 *
 * Sends a simple text message
 */

import { MessageSquare } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getMessageConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function MessageNode({ id, data, selected }: FlowNodeProps) {
  const { message } = getMessageConfig(data);

  return (
    <BaseNode
      selected={selected}
      icon={<MessageSquare className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.message.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.message.borderColor}
      title={data.name || "Send Message"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="text-sm text-muted-foreground line-clamp-3">
        {message || <span className="italic">Click to add message...</span>}
      </div>
    </BaseNode>
  );
}
