/**
 * HTTP Request Node Component
 *
 * Makes external API/webhook calls within the flow
 */

import { Globe } from "lucide-react";
import { Badge } from "@repo/ui";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getHttpRequestConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";

export function HttpRequestNode({ id, data, selected }: FlowNodeProps) {
  const { method, url, responseVariable } = getHttpRequestConfig(data);

  // Truncate URL for display
  const displayUrl = url
    ? url.length > 30
      ? url.substring(0, 30) + "..."
      : url
    : "No URL configured";

  return (
    <BaseNode
      selected={selected}
      icon={<Globe className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.httpRequest.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.httpRequest.borderColor}
      title={data.name || "HTTP Request"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {method}
          </Badge>
          <span className="text-sm text-muted-foreground truncate flex-1">
            {displayUrl}
          </span>
        </div>
        {responseVariable && (
          <div className="text-xs text-muted-foreground">
            Response saved to:{" "}
            <span className="font-mono text-foreground">
              {responseVariable}
            </span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
