/**
 * Variable Picker Component
 *
 * Manychat-style variable picker with:
 * - {} button to open picker
 * - Searchable dropdown with categorized variables
 * - Auto-extracts variables from flow nodes
 */

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  cn,
} from "@repo/ui";
import { Braces, Search } from "lucide-react";
import type { FlowEditorNode } from "../flow-editor.types";

export type VariableCategory = "inputs" | "variables" | "system";

export type AvailableVariable = {
  name: string;
  category: VariableCategory;
  description?: string;
  source?: string;
};

type VariablePickerProps = {
  nodes: FlowEditorNode[];
  onSelect: (variableName: string) => void;
  triggerClassName?: string;
};

/**
 * Extract available variables from flow nodes
 */
function extractVariablesFromNodes(
  nodes: FlowEditorNode[]
): AvailableVariable[] {
  const variables: AvailableVariable[] = [];
  const seen = new Set<string>();

  // System variables (always available) - these names are reserved
  const systemVars: AvailableVariable[] = [
    {
      name: "userMessage",
      category: "system",
      description: "Last user message",
    },
    {
      name: "timestamp",
      category: "system",
      description: "Current timestamp",
    },
  ];

  // Add system variables to both the array and the seen set
  for (const sysVar of systemVars) {
    variables.push(sysVar);
    seen.add(sysVar.name);
  }

  for (const node of nodes) {
    const action = node.data.actions[0];
    if (!action) continue;

    switch (action.type) {
      case "collect_input": {
        const config = action.config as { inputName?: string; prompt?: string };
        if (config.inputName && !seen.has(config.inputName)) {
          seen.add(config.inputName);
          variables.push({
            name: config.inputName,
            category: "inputs",
            source: node.data.name || "Collect Input",
            description: config.prompt?.substring(0, 40),
          });
        }
        break;
      }
      case "set_variable": {
        const config = action.config as { variableName?: string };
        if (config.variableName && !seen.has(config.variableName)) {
          seen.add(config.variableName);
          variables.push({
            name: config.variableName,
            category: "variables",
            source: node.data.name || "Set Variable",
          });
        }
        break;
      }
      case "http_request": {
        const config = action.config as { responseVariable?: string };
        if (config.responseVariable && !seen.has(config.responseVariable)) {
          seen.add(config.responseVariable);
          variables.push({
            name: config.responseVariable,
            category: "variables",
            source: node.data.name || "HTTP Request",
            description: "HTTP response data",
          });
        }
        break;
      }
    }
  }

  return variables;
}

const CATEGORY_LABELS: Record<VariableCategory, string> = {
  inputs: "Collected Inputs",
  variables: "Variables",
  system: "System",
};

export function VariablePicker({
  nodes,
  onSelect,
  triggerClassName,
}: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const variables = useMemo(() => extractVariablesFromNodes(nodes), [nodes]);

  const filteredVariables = useMemo(() => {
    if (!search) return variables;
    const lower = search.toLowerCase();
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(lower) ||
        v.description?.toLowerCase().includes(lower) ||
        v.source?.toLowerCase().includes(lower)
    );
  }, [variables, search]);

  const groupedVariables = useMemo(() => {
    const groups: Record<VariableCategory, AvailableVariable[]> = {
      inputs: [],
      variables: [],
      system: [],
    };
    for (const v of filteredVariables) {
      groups[v.category].push(v);
    }
    return groups;
  }, [filteredVariables]);

  const handleSelect = (name: string) => {
    onSelect(`{{${name}}}`);
    setIsOpen(false);
    setSearch("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearch("");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0", triggerClassName)}
          title="Insert variable"
          type="button"
        >
          <Braces className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="h-64">
          {(["inputs", "variables", "system"] as VariableCategory[]).map(
            (category) => {
              const categoryVars = groupedVariables[category];
              if (categoryVars.length === 0) return null;

              return (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </DropdownMenuLabel>
                  {categoryVars.map((v) => (
                    <DropdownMenuItem
                      key={`${category}-${v.name}`}
                      onClick={() => handleSelect(v.name)}
                      className="flex cursor-pointer flex-col items-start py-2"
                    >
                      <span className="font-mono text-sm text-primary">{`{{${v.name}}}`}</span>
                      {v.source && (
                        <span className="text-xs text-muted-foreground">
                          {v.source}
                          {v.description && ` - ${v.description}`}
                        </span>
                      )}
                      {!v.source && v.description && (
                        <span className="text-xs text-muted-foreground">
                          {v.description}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              );
            }
          )}

          {filteredVariables.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No variables found
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
