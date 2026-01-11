/**
 * Message Node Fields
 *
 * Properties panel fields for editing message nodes.
 */

import { Label, Textarea } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getMessageConfig } from "../nodes/node.utils";

/**
 * Render fields to edit a message node's content in the properties panel.
 *
 * Renders a labeled textarea populated with the node's current message and invokes `onUpdate`
 * with an action `{ type: "send_message", config: { message } }` when the textarea value changes.
 *
 * @param data - Node data used to obtain the current message configuration
 * @param onUpdate - Callback invoked with an update payload when the message is changed
 * @returns The JSX element containing the message editing fields
 */
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