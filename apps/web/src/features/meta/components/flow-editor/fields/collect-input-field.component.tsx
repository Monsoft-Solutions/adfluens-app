/**
 * Collect Input Node Fields
 *
 * Properties panel fields for editing collect input nodes.
 */

import { Input, Label, Textarea } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getCollectInputConfig } from "../nodes/node.utils";

/**
 * Render form fields for editing a collect_input node's prompt and target variable name.
 *
 * @param data - Node data used to derive the current `prompt` and `inputName` values
 * @param onUpdate - Callback invoked when either field changes; called with an object containing `actions: [{ type: "collect_input", config: { prompt, inputName } }]`
 * @returns The JSX element containing the Question textarea and Save response as input
 */
export function CollectInputNodeFields({ data, onUpdate }: NodeFieldProps) {
  const { prompt, inputName } = getCollectInputConfig(data);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "collect_input",
                  config: { prompt: e.target.value, inputName },
                },
              ],
            })
          }
          placeholder="What question do you want to ask?"
        />
      </div>
      <div className="space-y-2">
        <Label>Save response as</Label>
        <Input
          value={inputName}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "collect_input",
                  config: { prompt, inputName: e.target.value },
                },
              ],
            })
          }
          placeholder="variable_name"
          className="font-mono"
        />
      </div>
    </div>
  );
}