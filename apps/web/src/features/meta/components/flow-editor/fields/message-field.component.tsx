/**
 * Message Node Fields
 *
 * Properties panel fields for editing message nodes.
 */

import { Label, Textarea } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getMessageConfig } from "../nodes/node.utils";

export function MessageNodeFields({ data, onUpdate }: NodeFieldProps) {
  const { message } = getMessageConfig(data);

  return (
    <div className="space-y-2">
      <Label>Message</Label>
      <Textarea
        rows={4}
        value={message}
        onChange={(e) =>
          onUpdate({
            actions: [
              { type: "send_message", config: { message: e.target.value } },
            ],
          })
        }
        placeholder="Enter your message..."
      />
    </div>
  );
}
