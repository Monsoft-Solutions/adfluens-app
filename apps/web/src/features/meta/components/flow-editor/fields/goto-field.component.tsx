/**
 * Go To Node Fields
 *
 * Properties panel fields for editing goto nodes.
 * Features a dropdown selector for available nodes.
 */

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useMemo } from "react";
import type { NodeFieldProps } from "./field.types";
import { getGotoConfig } from "../nodes/node.utils";

export function GotoNodeFields({ data, onUpdate, nodes }: NodeFieldProps) {
  const { targetNodeId } = getGotoConfig(data);

  // Filter out entry nodes and the current node (if we had access to current node id)
  const availableNodes = useMemo(() => {
    return nodes.filter(
      (node) => node.data.nodeType !== "entry" && node.data.nodeType !== "goto"
    );
  }, [nodes]);

  const updateConfig = (updates: Partial<ReturnType<typeof getGotoConfig>>) => {
    onUpdate({
      actions: [
        {
          type: "goto_node",
          config: {
            targetNodeId,
            ...updates,
          },
        },
      ],
    });
  };

  // Find the currently selected node for display
  const selectedNode = availableNodes.find((n) => n.id === targetNodeId);

  return (
    <div className="space-y-4">
      {/* Target Node */}
      <div className="space-y-2">
        <Label>Jump To Node</Label>
        <Select
          value={targetNodeId}
          onValueChange={(value) => updateConfig({ targetNodeId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a node...">
              {selectedNode
                ? selectedNode.data.name ||
                  `Node ${selectedNode.id.slice(0, 8)}`
                : "Select a node..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableNodes.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No nodes available
              </div>
            ) : (
              availableNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  <div className="flex flex-col items-start">
                    <span>
                      {node.data.name || `Node ${node.id.slice(0, 8)}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {node.data.nodeType}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the node where the flow should continue
        </p>
      </div>

      <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium">Tips:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Use this to create loops or skip sections</li>
          <li>The flow will continue from the target node</li>
          <li>Avoid creating infinite loops</li>
        </ul>
      </div>
    </div>
  );
}
