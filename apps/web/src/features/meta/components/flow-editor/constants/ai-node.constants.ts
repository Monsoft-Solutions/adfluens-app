/**
 * AI Node Constants
 *
 * Shared constants for AI node components and fields.
 * Centralizes operation and model definitions to maintain DRY.
 */

import type {
  AiNodeOperation,
  AiNodeModel,
  ExtractedField,
} from "../flow-editor.types";

// ============================================================================
// Operations
// ============================================================================

export type AiOperationInfo = {
  value: AiNodeOperation;
  label: string;
  description: string;
};

/**
 * AI operation definitions with labels and descriptions
 */
export const AI_OPERATIONS: AiOperationInfo[] = [
  {
    value: "generate_response",
    label: "Generate Response",
    description: "Conversational AI reply",
  },
  {
    value: "generate_content",
    label: "Generate Content",
    description: "Custom content generation",
  },
  {
    value: "extract_data",
    label: "Extract Data",
    description: "Extract structured data to variables",
  },
  {
    value: "classify_intent",
    label: "Classify Intent",
    description: "Classify with custom categories",
  },
  {
    value: "analyze_sentiment",
    label: "Analyze Sentiment",
    description: "Sentiment analysis",
  },
  { value: "summarize", label: "Summarize", description: "Text summarization" },
  {
    value: "translate",
    label: "Translate",
    description: "Language translation",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Full control with custom prompts",
  },
];

/**
 * Quick lookup map for operation labels (used in node display)
 */
export const AI_OPERATION_LABELS: Record<AiNodeOperation, string> =
  Object.fromEntries(AI_OPERATIONS.map((op) => [op.value, op.label])) as Record<
    AiNodeOperation,
    string
  >;

// ============================================================================
// Models
// ============================================================================

export type AiModelInfo = {
  value: AiNodeModel;
  label: string;
  tier: "Premium" | "Standard" | "Economy";
  description: string;
};

/**
 * Available AI models with labels and tier info
 */
export const AI_MODELS: AiModelInfo[] = [
  {
    value: "gpt-4o",
    label: "GPT-4o",
    tier: "Premium",
    description: "Most capable model, best for complex tasks",
  },
  {
    value: "gpt-4o-mini",
    label: "GPT-4o Mini",
    tier: "Standard",
    description: "Fast and cost-effective, great for most tasks",
  },
  {
    value: "gpt-4.1",
    label: "GPT-4.1",
    tier: "Premium",
    description: "Extended context (1M+ tokens), best for long documents",
  },
  {
    value: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    tier: "Standard",
    description: "Extended context, balanced speed and quality",
  },
  {
    value: "gpt-4.1-nano",
    label: "GPT-4.1 Nano",
    tier: "Economy",
    description: "Extended context, most cost-effective",
  },
];

/**
 * Default model for new AI nodes
 */
export const DEFAULT_AI_MODEL: AiNodeModel = "gpt-4o-mini";

// ============================================================================
// Field Types
// ============================================================================

/**
 * Field type options for extraction schema builder
 */
export const EXTRACTION_FIELD_TYPES: Array<{
  value: ExtractedField["type"];
  label: string;
}> = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes/No" },
  { value: "array", label: "List" },
];

// ============================================================================
// Languages
// ============================================================================

export type LanguageOption = {
  code: string;
  name: string;
};

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "hi", name: "Hindi" },
];
