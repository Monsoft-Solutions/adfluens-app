/**
 * AI Node Model Configuration
 *
 * Maps user-facing model names to provider model IDs
 */

import type { MetaAiNodeModel } from "@repo/db";

/**
 * Map of model names to their provider model IDs
 */
export const MODEL_MAP: Record<MetaAiNodeModel, string> = {
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4.1": "gpt-4.1",
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4.1-nano": "gpt-4.1-nano",
};

/**
 * Model information for UI display
 */
export const MODEL_INFO: Record<
  MetaAiNodeModel,
  { name: string; tier: string; description: string }
> = {
  "gpt-4o": {
    name: "GPT-4o",
    tier: "Premium",
    description: "Most capable model, best for complex tasks",
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    tier: "Standard",
    description: "Fast and cost-effective, great for most tasks",
  },
  "gpt-4.1": {
    name: "GPT-4.1",
    tier: "Premium",
    description: "Extended context (1M+ tokens), best for long documents",
  },
  "gpt-4.1-mini": {
    name: "GPT-4.1 Mini",
    tier: "Standard",
    description: "Extended context, balanced speed and quality",
  },
  "gpt-4.1-nano": {
    name: "GPT-4.1 Nano",
    tier: "Economy",
    description: "Extended context, most cost-effective",
  },
};

/**
 * Default model for AI node operations
 */
export const DEFAULT_MODEL: MetaAiNodeModel = "gpt-4o-mini";
