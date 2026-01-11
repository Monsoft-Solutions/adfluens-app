/**
 * AI Node Component
 *
 * Versatile AI node that can perform various AI operations:
 * - Generate Response (conversational)
 * - Generate Content (custom prompt)
 * - Extract Data (structured extraction)
 * - Classify Intent (custom categories)
 * - Analyze Sentiment
 * - Summarize
 * - Translate
 * - Custom (full control)
 */

import { Sparkles } from "lucide-react";
import { BaseNode } from "./base-node.component";
import type { FlowNodeProps } from "../flow-editor.types";
import {
  getNodeDeleteHandler,
  getAiNodeConfig,
  NODE_ICON_SIZE,
  NODE_STYLES,
} from "./node.utils";
import { AI_OPERATION_LABELS } from "../constants/ai-node.constants";

export function AiNode({ id, data, selected }: FlowNodeProps) {
  const config = getAiNodeConfig(data);
  const operation = config.operation || "generate_response";
  const operationLabel = AI_OPERATION_LABELS[operation] || "AI Operation";

  return (
    <BaseNode
      selected={selected}
      icon={<Sparkles className={NODE_ICON_SIZE} />}
      iconColor={NODE_STYLES.aiResponse.iconColor}
      bgColor="bg-card"
      borderColor={NODE_STYLES.aiResponse.borderColor}
      title={data.name || "AI Node"}
      onDelete={getNodeDeleteHandler(data, id)}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">
          {operationLabel}
        </div>
        {config.outputVariable && (
          <div className="text-xs text-muted-foreground">
            Output:{" "}
            <span className="font-mono">{`{{${config.outputVariable}}}`}</span>
          </div>
        )}
        {operation === "extract_data" &&
          config.extractionSchema &&
          config.extractionSchema.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Fields: {config.extractionSchema.map((f) => f.name).join(", ")}
            </div>
          )}
        {operation === "classify_intent" &&
          config.classificationCategories &&
          config.classificationCategories.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Categories:{" "}
              {config.classificationCategories.slice(0, 3).join(", ")}
              {config.classificationCategories.length > 3 && "..."}
            </div>
          )}
        {operation === "translate" && config.targetLanguage && (
          <div className="text-xs text-muted-foreground">
            Target: {config.targetLanguage}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
