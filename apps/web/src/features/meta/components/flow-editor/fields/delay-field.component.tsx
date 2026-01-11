/**
 * Delay Node Fields
 *
 * Properties panel fields for editing delay nodes.
 */

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getDelayConfig } from "../nodes/node.utils";

/**
 * Render form controls for configuring a delay action on a flow node.
 *
 * Renders an input for the delay amount (min 1), a unit selector (minutes, hours, days),
 * and updates the parent via `onUpdate` with an action of type `"delay"` containing
 * the selected `delayAmount` and `delayUnit`.
 *
 * @param data - Node data from which the initial delay configuration is derived
 * @param onUpdate - Callback invoked with an update payload containing the delay action
 * @returns A React element containing the delay configuration UI
 */
export function DelayNodeFields({ data, onUpdate }: NodeFieldProps) {
  const { delayAmount, delayUnit } = getDelayConfig(data);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait for</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={delayAmount}
            onChange={(e) =>
              onUpdate({
                actions: [
                  {
                    type: "delay",
                    config: {
                      delayAmount: parseInt(e.target.value) || 1,
                      delayUnit,
                    },
                  },
                ],
              })
            }
            className="w-20"
          />
          <Select
            value={delayUnit}
            onValueChange={(value) =>
              onUpdate({
                actions: [
                  {
                    type: "delay",
                    config: {
                      delayAmount,
                      delayUnit: value as "minutes" | "hours" | "days",
                    },
                  },
                ],
              })
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>The flow will pause and continue after this time.</p>
        <p className="mt-1">
          If the user sends a message during the wait, the delay is cancelled.
        </p>
      </div>
    </div>
  );
}