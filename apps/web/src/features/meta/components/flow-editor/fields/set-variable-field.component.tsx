/**
 * Set Variable Node Fields
 *
 * Properties panel fields for editing set variable nodes.
 */

import { Input, Label } from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getSetVariableConfig } from "../nodes/node.utils";
import { VariableTextarea } from "./variable-input.component";

export function SetVariableNodeFields({
  data,
  onUpdate,
  nodes,
}: NodeFieldProps) {
  const { variableName, value } = getSetVariableConfig(data);

  const updateConfig = (
    updates: Partial<ReturnType<typeof getSetVariableConfig>>
  ) => {
    onUpdate({
      actions: [
        {
          type: "set_variable",
          config: {
            variableName,
            value,
            ...updates,
          },
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Variable Name */}
      <div className="space-y-2">
        <Label>Variable Name</Label>
        <Input
          placeholder="userName"
          value={variableName}
          onChange={(e) => updateConfig({ variableName: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use camelCase without spaces
        </p>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label>Value</Label>
        <VariableTextarea
          nodes={nodes}
          placeholder="Enter value or use {{inputName}} for dynamic values"
          value={typeof value === "string" ? value : JSON.stringify(value)}
          onValueChange={(newValue) => updateConfig({ value: newValue })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Click the {"{}"} button to insert variables
        </p>
      </div>

      <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium">Examples:</p>
        <ul className="space-y-1">
          <li>
            <code className="rounded bg-muted px-1">userName</code> ={" "}
            {"{{collectedName}}"}
          </li>
          <li>
            <code className="rounded bg-muted px-1">greeting</code> =
            &quot;Hello, welcome!&quot;
          </li>
          <li>
            <code className="rounded bg-muted px-1">isVIP</code> = true
          </li>
        </ul>
      </div>
    </div>
  );
}
