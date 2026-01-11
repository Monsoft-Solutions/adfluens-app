/**
 * Condition Node Fields
 *
 * Enhanced properties panel with visual condition builder.
 */

import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Plus, Trash2 } from "lucide-react";
import type { NodeFieldProps } from "./field.types";
import type {
  SingleCondition,
  ConditionOperator,
  FlowConditionGroup,
} from "../flow-editor.types";

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const EMPTY_OPERATORS: ConditionOperator[] = ["is_empty", "is_not_empty"];

export function ConditionNodeFields({
  data,
  onUpdate,
  nodes: _nodes,
}: NodeFieldProps) {
  const condition = data.conditions?.[0];
  const [useAdvancedMode, setUseAdvancedMode] = useState(
    !!condition?.conditionGroup
  );

  // Initialize condition group
  const conditionGroup: FlowConditionGroup = condition?.conditionGroup || {
    logic: "and",
    conditions: [{ variable: "", operator: "equals", value: "" }],
  };

  // Legacy expression mode
  const expression = condition?.expression || "";

  const updateConditionGroup = (group: FlowConditionGroup) => {
    onUpdate({
      conditions: [
        {
          conditionGroup: group,
          targetNodeId: condition?.targetNodeId || "",
        },
      ],
    });
  };

  const updateExpression = (expr: string) => {
    onUpdate({
      conditions: [
        {
          expression: expr,
          targetNodeId: condition?.targetNodeId || "",
        },
      ],
    });
  };

  const addCondition = () => {
    updateConditionGroup({
      ...conditionGroup,
      conditions: [
        ...conditionGroup.conditions,
        { variable: "", operator: "equals", value: "" },
      ],
    });
  };

  const removeCondition = (index: number) => {
    if (conditionGroup.conditions.length <= 1) return;
    updateConditionGroup({
      ...conditionGroup,
      conditions: conditionGroup.conditions.filter((_, i) => i !== index),
    });
  };

  const updateSingleCondition = (
    index: number,
    updates: Partial<SingleCondition>
  ) => {
    updateConditionGroup({
      ...conditionGroup,
      conditions: conditionGroup.conditions.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      ),
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setUseAdvancedMode(false)}
          className={`text-xs px-2 py-1 rounded ${
            !useAdvancedMode
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Simple
        </button>
        <button
          onClick={() => setUseAdvancedMode(true)}
          className={`text-xs px-2 py-1 rounded ${
            useAdvancedMode
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Advanced
        </button>
      </div>

      {useAdvancedMode ? (
        <>
          {/* Logic Selector */}
          <div className="space-y-2">
            <Label>Match</Label>
            <Select
              value={conditionGroup.logic}
              onValueChange={(value: "and" | "or") =>
                updateConditionGroup({ ...conditionGroup, logic: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">ALL conditions (AND)</SelectItem>
                <SelectItem value="or">ANY condition (OR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditions List */}
          <div className="space-y-3">
            <Label>Conditions</Label>
            {conditionGroup.conditions.map((cond, index) => (
              <div key={index} className="space-y-2 p-2 bg-muted/50 rounded-md">
                {/* Variable */}
                <Input
                  placeholder="Variable name (e.g., userInput)"
                  value={cond.variable}
                  onChange={(e) =>
                    updateSingleCondition(index, { variable: e.target.value })
                  }
                  className="text-sm"
                />

                {/* Operator */}
                <Select
                  value={cond.operator}
                  onValueChange={(value: ConditionOperator) =>
                    updateSingleCondition(index, { operator: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Value (hidden for is_empty/is_not_empty) */}
                {!EMPTY_OPERATORS.includes(cond.operator) && (
                  <Input
                    placeholder="Value to compare"
                    value={cond.value}
                    onChange={(e) =>
                      updateSingleCondition(index, { value: e.target.value })
                    }
                    className="text-sm"
                  />
                )}

                {/* Remove button */}
                {conditionGroup.conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Condition
            </Button>
          </div>
        </>
      ) : (
        /* Simple Expression Mode */
        <div className="space-y-2">
          <Label>Condition</Label>
          <Input
            value={expression}
            onChange={(e) => updateExpression(e.target.value)}
            placeholder="contains:keyword"
          />
          <p className="text-xs text-muted-foreground">
            Formats: contains:word, equals:value, regex:pattern
          </p>
        </div>
      )}

      {/* Output explanation */}
      <div className="text-xs text-muted-foreground border-t pt-3">
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
