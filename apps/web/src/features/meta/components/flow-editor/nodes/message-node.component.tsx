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

/**
 * Renders a flow-editor node that displays a message with an icon, styling, and a delete action.
 *
 * @param data - Node data; `name` provides the node title and message content (if present) is displayed
 * @param selected - Whether the node is currently selected, affecting visual state
 * @returns The React element representing the message node
 */
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