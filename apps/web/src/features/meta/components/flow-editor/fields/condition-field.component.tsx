/**
 * Condition Node Fields
 *
 * Properties panel fields for editing condition nodes.
 */

import { Input, Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";

/**
 * Render UI controls to edit the first condition expression of a condition node.
 *
 * Renders a labeled text input bound to the node's first condition expression (defaults to an empty string),
 * updates the node via `onUpdate` with a single-element `conditions` array preserving `targetNodeId`,
 * and displays helper text describing accepted condition formats and color-coded output meanings.
 *
 * @param data - Node data containing an optional `conditions` array; the component reads `conditions[0]`.
 * @param onUpdate - Callback invoked with partial node updates; called with `{ conditions: [{ expression, targetNodeId }] }`.
 * @returns A JSX element with the condition input, helper text, and informational output color legend.
 */
export function ConditionNodeFields({ data, onUpdate }: NodeFieldProps) {
  const condition = data.conditions?.[0];
  const expression = condition?.expression || "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Condition</Label>
        <Input
          value={expression}
          onChange={(e) =>
            onUpdate({
              conditions: [
                {
                  expression: e.target.value,
                  targetNodeId: condition?.targetNodeId || "",
                },
              ],
            })
          }
          placeholder="contains:keyword"
        />
        <p className="text-xs text-muted-foreground">
          Formats: contains:word, equals:value, regex:pattern
        </p>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>
          <span className="text-emerald-600 dark:text-emerald-400">
            Green output
          </span>{" "}
          = condition true
        </p>
        <p>
          <span className="text-rose-600 dark:text-rose-400">Red output</span> =
          condition false
        </p>
      </div>
    </div>
  );
}