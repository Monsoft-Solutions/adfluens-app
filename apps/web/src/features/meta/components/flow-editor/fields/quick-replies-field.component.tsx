/**
 * Quick Replies Node Fields
 *
 * Properties panel fields for editing quick replies nodes.
 */

import { Input, Label, Textarea } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getQuickRepliesConfig } from "../nodes/node.utils";

/**
 * Render properties panel fields for editing a quick replies node.
 *
 * Renders a "Message" textarea and a "Button Options (comma-separated)" input bound to the node's quick replies configuration; updates invoke the provided callback with an action of type `"send_quick_replies"`.
 *
 * @param data - Node data containing the quick replies configuration
 * @param onUpdate - Callback invoked with an update object when the message or replies change
 * @returns The JSX element containing the editable message and replies fields
 */
export function QuickRepliesNodeFields({ data, onUpdate }: NodeFieldProps) {
  const { message, replies } = getQuickRepliesConfig(data);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          rows={3}
          value={message}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "send_quick_replies",
                  config: { message: e.target.value, replies },
                },
              ],
            })
          }
          placeholder="Enter your message..."
        />
      </div>
      <div className="space-y-2">
        <Label>Button Options (comma-separated)</Label>
        <Input
          value={replies.join(", ")}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "send_quick_replies",
                  config: {
                    message,
                    replies: e.target.value.split(",").map((r) => r.trim()),
                  },
                },
              ],
            })
          }
          placeholder="Option 1, Option 2, Option 3"
        />
      </div>
    </div>
  );
}