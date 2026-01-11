/**
 * Quick Replies Node Component
 *
 * Sends a message with button options for the user
 */

import { MousePointer2 } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type QuickRepliesNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function QuickRepliesNode({
  id,
  data,
  selected,
}: QuickRepliesNodeProps) {
  const action = data.actions[0];
  const message = (action?.config?.message as string) || "";
  const replies = (action?.config?.replies as string[]) || [];

  return (
    <BaseNode
      selected={selected}
      icon={<MousePointer2 className="w-4 h-4" />}
      iconColor="bg-blue-500/20 text-blue-500"
      bgColor="bg-card"
      borderColor="ring-blue-500"
      title={data.name || "Quick Replies"}
      hasTargetHandle={true}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground line-clamp-2">
          {message || <span className="italic">Click to add message...</span>}
        </div>
        {replies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {replies.slice(0, 3).map((reply, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {reply}
              </Badge>
            ))}
            {replies.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{replies.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
