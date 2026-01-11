/**
 * Entry Node Component
 *
 * The starting point of a flow - shows trigger keywords
 */

import { Zap } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";
import { BadgeList } from "./badge-list.component";

/**
 * Renders the entry point node for a flow, showing the node title, a subtitle, and trigger keyword badges.
 *
 * @param id - Node identifier used for actions such as deletion
 * @param data - Node data; `data.triggers` (array) is filtered for items with `type === "keyword"` to display as badges, and `data.name` is used as the node title
 * @param selected - Whether the node is currently selected (affects node styling)
 * @returns A React element representing the entry point node, including a list of trigger keyword badges or a "No triggers set" fallback
 */
export function EntryNode({ id, data, selected }: FlowNodeProps) {
  const triggers = data.triggers || [];
  const keywords = triggers
    .filter((t) => t.type === "keyword")
    .map((t) => t.value);

  return (
    <BaseNode
      selected={selected}
      icon={<Zap className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.entry.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.entry.borderColor}
      title={data.name || "Entry Point"}
      subtitle="Flow starts here"
      hasTargetHandle={false}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Trigger keywords:</div>
        {keywords.length > 0 ? (
          <BadgeList
            items={keywords}
            limit={4}
            primaryVariant="secondary"
            overflowVariant="outline"
          />
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No triggers set
          </div>
        )}
      </div>
    </BaseNode>
  );
}