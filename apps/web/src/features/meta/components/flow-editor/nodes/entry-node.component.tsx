/**
 * Entry Node Component
 *
 * The starting point of a flow - shows trigger keywords
 */

import { Zap } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeData } from "../flow-editor.types";

type EntryNodeProps = {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
};

export function EntryNode({ id, data, selected }: EntryNodeProps) {
  const triggers = data.triggers || [];
  const keywords = triggers
    .filter((t) => t.type === "keyword")
    .map((t) => t.value);

  return (
    <BaseNode
      selected={selected}
      icon={<Zap className="w-4 h-4" />}
      iconColor="bg-green-500/20 text-green-500"
      bgColor="bg-card"
      borderColor="ring-green-500"
      title={data.name || "Entry Point"}
      subtitle="Flow starts here"
      hasTargetHandle={false}
      hasSourceHandle={true}
      onDelete={data.onDelete ? () => data.onDelete?.(id) : undefined}
    >
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Trigger keywords:</div>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 4).map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {keywords.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{keywords.length - 4} more
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No triggers set
          </div>
        )}
      </div>
    </BaseNode>
  );
}
