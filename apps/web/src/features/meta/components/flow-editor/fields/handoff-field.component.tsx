/**
 * Handoff Node Fields
 *
 * Properties panel fields for editing handoff nodes.
 */

import { Input, Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getHandoffConfig } from "../nodes/node.utils";

export function HandoffNodeFields({
  data,
  onUpdate,
  nodes: _nodes,
}: NodeFieldProps) {
  const { reason } = getHandoffConfig(data);

  return (
    <div className="space-y-2">
      <Label>Handoff Reason</Label>
      <Input
        value={reason}
        onChange={(e) =>
          onUpdate({
            actions: [{ type: "handoff", config: { reason: e.target.value } }],
          })
        }
        placeholder="Why are you handing off?"
      />
    </div>
  );
}
