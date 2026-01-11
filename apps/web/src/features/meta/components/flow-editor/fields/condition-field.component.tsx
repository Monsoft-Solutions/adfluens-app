/**
 * Condition Node Fields
 *
 * Properties panel fields for editing condition nodes.
 */

import { Input, Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";

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
