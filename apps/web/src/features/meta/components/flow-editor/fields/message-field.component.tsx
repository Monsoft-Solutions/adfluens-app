/**
 * Message Node Fields
 *
 * Properties panel fields for editing message nodes.
 */

import { Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getMessageConfig } from "../nodes/node.utils";
import { VariableTextarea } from "./variable-input.component";

export function MessageNodeFields({ data, onUpdate, nodes }: NodeFieldProps) {
  const { message } = getMessageConfig(data);

  return (
    <div className="space-y-2">
      <Label>Message</Label>
      <VariableTextarea
        nodes={nodes}
        rows={4}
        value={message}
        onValueChange={(value) =>
          onUpdate({
            actions: [{ type: "send_message", config: { message: value } }],
          })
        }
        placeholder="Enter your message..."
      />
      <p className="text-xs text-muted-foreground">
        Click the {"{}"} button to insert variables
      </p>
    </div>
  );
}
