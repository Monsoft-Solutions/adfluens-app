/**
 * Collect Input Node Component
 *
 * Asks a question and saves the user's response to a variable
 */

import { TextCursorInput } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getCollectInputConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function CollectInputNode({ id, data, selected }: FlowNodeProps) {
  const { prompt, inputName } = getCollectInputConfig(data);

  return (
    <BaseNode
      selected={selected}
      icon={<TextCursorInput className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.collectInput.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.collectInput.borderColor}
      title={data.name || "Collect Input"}
      onDelete={getNodeDeleteHandler(data, id)}
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
