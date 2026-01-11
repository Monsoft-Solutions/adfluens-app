/**
 * Set Variable Node Component
 *
 * Stores a value in a variable for later use in the flow
 */

import { Variable } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getSetVariableConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function SetVariableNode({ id, data, selected }: FlowNodeProps) {
  const { variableName, value } = getSetVariableConfig(data);

  // Format value for display
  const displayValue =
    typeof value === "string"
      ? value.length > 25
        ? `"${value.substring(0, 25)}..."`
        : `"${value}"`
      : String(value);

  return (
    <BaseNode
      selected={selected}
      icon={<Variable className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.setVariable.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.setVariable.borderColor}
      title={data.name || "Set Variable"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        {variableName ? (
          <>
            <div className="text-sm">
              <span className="font-mono text-teal-500">{variableName}</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-foreground">{displayValue}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Variable stored for later use
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Configure variable name and value
          </div>
        )}
      </div>
    </BaseNode>
  );
}
