/**
 * Quick Replies Node Fields
 *
 * Properties panel fields for editing quick replies nodes.
 */

import { Input, Label, Textarea } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getQuickRepliesConfig } from "../nodes/node.utils";

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
