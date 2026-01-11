/**
 * AI Node Fields
 *
 * Properties panel fields for editing AI node configuration.
 * Supports multiple operation types with operation-specific settings.
 */

import { useState } from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Switch,
  Badge,
  Button,
  cn,
} from "@repo/ui";
import { Plus, Trash2, Code, Layers } from "lucide-react";
import type { NodeFieldProps } from "./field.types";
import type {
  AiNodeActionConfig,
  AiNodeOperation,
  AiNodeModel,
  ExtractedField,
} from "../flow-editor.types";
import { getAiNodeConfig } from "../nodes/node.utils";
import {
  AI_OPERATIONS,
  AI_MODELS,
  EXTRACTION_FIELD_TYPES,
  SUPPORTED_LANGUAGES,
} from "../constants/ai-node.constants";

// ============================================================================
// Main Component
// ============================================================================

export function AiNodeFields({ data, onUpdate }: NodeFieldProps) {
  const config = getAiNodeConfig(data);
  const operation = config.operation || "generate_response";
  const [showJsonSchema, setShowJsonSchema] = useState(false);

  const updateConfig = (updates: Partial<AiNodeActionConfig>) => {
    onUpdate({
      actions: [
        {
          type: "ai_node",
          config: {
            ...config,
            ...updates,
          },
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Operation Type */}
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={operation}
          onValueChange={(value) =>
            updateConfig({ operation: value as AiNodeOperation })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_OPERATIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operation-specific settings */}
      {operation === "extract_data" && (
        <ExtractionSchemaSection
          config={config}
          updateConfig={updateConfig}
          showJsonSchema={showJsonSchema}
          setShowJsonSchema={setShowJsonSchema}
        />
      )}

      {operation === "classify_intent" && (
        <ClassificationSection config={config} updateConfig={updateConfig} />
      )}

      {operation === "translate" && (
        <TranslateSection config={config} updateConfig={updateConfig} />
      )}

      {/* Prompt Customization (for applicable operations) */}
      {(operation === "generate_content" ||
        operation === "custom" ||
        operation === "generate_response") && (
        <PromptSection config={config} updateConfig={updateConfig} />
      )}

      {/* Output Settings */}
      <OutputSettingsSection
        config={config}
        updateConfig={updateConfig}
        operation={operation}
      />

      {/* Model Settings */}
      <ModelSettingsSection config={config} updateConfig={updateConfig} />
    </div>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function ExtractionSchemaSection({
  config,
  updateConfig,
  showJsonSchema,
  setShowJsonSchema,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
  showJsonSchema: boolean;
  setShowJsonSchema: (show: boolean) => void;
}) {
  const fields = config.extractionSchema || [];

  const addField = () => {
    updateConfig({
      extractionSchema: [
        ...fields,
        { name: "", type: "string", description: "", required: false },
      ],
    });
  };

  const updateField = (index: number, updates: Partial<ExtractedField>) => {
    const newFields = [...fields];
    const currentField = newFields[index];
    if (currentField) {
      newFields[index] = { ...currentField, ...updates };
      updateConfig({ extractionSchema: newFields });
    }
  };

  const removeField = (index: number) => {
    updateConfig({ extractionSchema: fields.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Extraction Schema</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowJsonSchema(!showJsonSchema)}
          className="h-7 px-2"
        >
          {showJsonSchema ? (
            <Layers className="w-4 h-4" />
          ) : (
            <Code className="w-4 h-4" />
          )}
          <span className="ml-1 text-xs">
            {showJsonSchema ? "Visual" : "JSON"}
          </span>
        </Button>
      </div>

      {showJsonSchema ? (
        <div className="space-y-2">
          <Textarea
            placeholder='{"properties": {"email": {"type": "string", "description": "Email address"}}, "required": ["email"]}'
            value={config.extractionSchemaJson || ""}
            onChange={(e) =>
              updateConfig({ extractionSchemaJson: e.target.value })
            }
            rows={6}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            JSON Schema format for advanced users
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  className="flex-1 h-8"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    updateField(index, {
                      type: value as ExtractedField["type"],
                    })
                  }
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRACTION_FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input
                placeholder="Description (helps AI understand)"
                value={field.description}
                onChange={(e) =>
                  updateField(index, { description: e.target.value })
                }
                className="h-8 text-xs"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    updateField(index, { required: checked })
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Required field
                </span>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addField}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

function ClassificationSection({
  config,
  updateConfig,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
}) {
  const categories = config.classificationCategories || [];
  const [newCategory, setNewCategory] = useState("");

  const addCategory = () => {
    if (newCategory.trim()) {
      updateConfig({
        classificationCategories: [...categories, newCategory.trim()],
      });
      setNewCategory("");
    }
  };

  const removeCategory = (index: number) => {
    updateConfig({
      classificationCategories: categories.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-2">
      <Label>Classification Categories</Label>
      <div className="flex flex-wrap gap-1">
        {categories.map((cat, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {cat}
            <button
              onClick={() => removeCategory(index)}
              className="ml-1 hover:text-destructive"
            >
              &times;
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add category..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
          className="flex-1 h-8"
        />
        <Button variant="outline" size="sm" onClick={addCategory}>
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        AI will classify messages into one of these categories
      </p>
    </div>
  );
}

function TranslateSection({
  config,
  updateConfig,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Target Language</Label>
      <Select
        value={config.targetLanguage || "en"}
        onValueChange={(value) => updateConfig({ targetLanguage: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PromptSection({
  config,
  updateConfig,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>System Prompt (optional)</Label>
        <Textarea
          placeholder="Define the AI's behavior and context..."
          value={config.customSystemPrompt || ""}
          onChange={(e) => updateConfig({ customSystemPrompt: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>User Prompt Template (optional)</Label>
        <Textarea
          placeholder="Use {{variableName}} to insert variables..."
          value={config.customUserPrompt || ""}
          onChange={(e) => updateConfig({ customUserPrompt: e.target.value })}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the user&apos;s message directly
        </p>
      </div>
    </div>
  );
}

function OutputSettingsSection({
  config,
  updateConfig,
  operation,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
  operation: AiNodeOperation;
}) {
  const defaultSendAsMessage =
    operation === "generate_response" ||
    operation === "generate_content" ||
    operation === "custom";

  return (
    <div className="space-y-3 border-t pt-3">
      <h4 className="text-sm font-medium">Output Settings</h4>

      <div className="space-y-2">
        <Label>Save to Variable (optional)</Label>
        <Input
          placeholder="ai_result"
          value={config.outputVariable || ""}
          onChange={(e) => updateConfig({ outputVariable: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Access result as {`{{${config.outputVariable || "ai_result"}}}`}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Send as Message</Label>
          <p className="text-xs text-muted-foreground">
            Send AI output as bot message
          </p>
        </div>
        <Switch
          checked={config.sendAsMessage ?? defaultSendAsMessage}
          onCheckedChange={(checked) =>
            updateConfig({ sendAsMessage: checked })
          }
        />
      </div>
    </div>
  );
}

function ModelSettingsSection({
  config,
  updateConfig,
}: {
  config: AiNodeActionConfig;
  updateConfig: (updates: Partial<AiNodeActionConfig>) => void;
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <h4 className="text-sm font-medium">Model Settings</h4>

      <div className="space-y-2">
        <Label>Model</Label>
        <Select
          value={config.model || "gpt-4o-mini"}
          onValueChange={(value) =>
            updateConfig({ model: value as AiNodeModel })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span>{opt.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1",
                      opt.tier === "Premium" &&
                        "border-amber-500 text-amber-600",
                      opt.tier === "Standard" &&
                        "border-blue-500 text-blue-600",
                      opt.tier === "Economy" &&
                        "border-green-500 text-green-600"
                    )}
                  >
                    {opt.tier}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Temperature</Label>
          <span className="text-xs text-muted-foreground">
            {(config.temperature ?? 0.7).toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature ?? 0.7}
          onChange={(e) =>
            updateConfig({ temperature: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>
    </div>
  );
}
