/**
 * Collect Input Node Component
 *
 * Asks a question and saves the user's response to a variable
 */

import { TextCursorInput } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type CollectInputNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function CollectInputNode({
  id,
  data,
  selected,
}: CollectInputNodeProps) {
  const action = data.actions[0];
  const prompt = (action?.config?.prompt as string) || "";
  const inputName = (action?.config?.inputName as string) || "";

  return (
    <BaseNode
      selected={selected}
      icon={<TextCursorInput className="w-4 h-4" />}
      iconColor="bg-purple-500/20 text-purple-500"
      bgColor="bg-card"
      borderColor="ring-purple-500"
      title={data.name || "Collect Input"}
      hasTargetHandle={true}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground line-clamp-2">
          {prompt || <span className="italic">Click to add question...</span>}
        </div>
        {inputName && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Save to:</span>
            <Badge variant="secondary" className="text-xs font-mono">
              {inputName}
            </Badge>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
