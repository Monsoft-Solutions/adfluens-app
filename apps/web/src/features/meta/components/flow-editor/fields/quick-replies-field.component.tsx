/**
 * Quick Replies Node Fields
 *
 * Properties panel fields for editing quick replies nodes.
 */

import { Input, Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getQuickRepliesConfig } from "../nodes/node.utils";
import { VariableTextarea } from "./variable-input.component";

export function QuickRepliesNodeFields({
  data,
  onUpdate,
  nodes,
}: NodeFieldProps) {
  const { message, replies } = getQuickRepliesConfig(data);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message</Label>
        <VariableTextarea
          nodes={nodes}
          rows={3}
          value={message}
          onValueChange={(value) =>
            onUpdate({
              actions: [
                {
                  type: "send_quick_replies",
                  config: { message: value, replies },
                },
              ],
            })
          }
          placeholder="Enter your message..."
        />
        <p className="text-xs text-muted-foreground">
          Click the {"{}"} button to insert variables
        </p>
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
