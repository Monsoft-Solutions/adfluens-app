/**
 * Quick Replies Node Component
 *
 * Sends a message with button options for the user
 */

import { MousePointer2 } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getQuickRepliesConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";
import { BadgeList } from "./badge-list.component";

export function QuickRepliesNode({ id, data, selected }: FlowNodeProps) {
  const { message, replies } = getQuickRepliesConfig(data);

  return (
    <BaseNode
      selected={selected}
      icon={<MousePointer2 className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.quickReplies.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.quickReplies.borderColor}
      title={data.name || "Quick Replies"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground line-clamp-2">
          {message || <span className="italic">Click to add message...</span>}
        </div>
        <BadgeList items={replies} limit={3} />
      </div>
    </BaseNode>
  );
}
