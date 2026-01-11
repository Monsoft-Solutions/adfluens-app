/**
 * Delay Node Component
 *
 * Pauses flow execution for a specified duration before continuing
 */

import { Clock } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getDelayConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function DelayNode({ id, data, selected }: FlowNodeProps) {
  const { delayAmount, delayUnit } = getDelayConfig(data);

  // Format the display text
  const formatDelay = () => {
    const unitLabel = delayAmount === 1 ? delayUnit.slice(0, -1) : delayUnit;
    return `${delayAmount} ${unitLabel}`;
  };

  return (
    <BaseNode
      selected={selected}
      icon={<Clock className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.delay.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.delay.borderColor}
      title={data.name || "Wait"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Wait{" "}
          <span className="font-medium text-foreground">{formatDelay()}</span>{" "}
          before continuing
        </div>
        <div className="text-xs text-muted-foreground/70">
          Flow pauses until the delay expires
        </div>
      </div>
    </BaseNode>
  );
}
