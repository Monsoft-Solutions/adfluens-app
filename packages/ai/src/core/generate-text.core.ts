/**
 * Core Generate Text Function
 *
 * Wrapper for AI SDK generateText with centralized configuration.
 * Provides a single point for telemetry, error handling, and other cross-cutting concerns.
 *
 * @module @repo/ai/core/generate-text
 */
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import type { CoreGenerateTextOptions } from "./types.core";
import { DEFAULT_CHAT_MODEL_ID } from "../models/available-models.constant";
import { telemetryConfig } from "../telemetry";

// Re-export result type for consumers
export type { GenerateTextResult } from "ai";

/**
 * Generate text using AI
 *
 * Wraps the AI SDK generateText function with consistent configuration
 * and a centralized extension point for telemetry.
 *
 * @param options - Generation options including prompts and model config
 * @returns The generation result with text and metadata
 *
 * @example
 * ```typescript
 * // Simple prompt-based generation
 * const result = await coreGenerateText({
 *   system: 'You are a helpful assistant',
 *   prompt: 'Write a haiku about coding',
 *   modelId: 'gpt-4o-mini',
 * })
 * console.log(result.text)
 *
 * // Chat-based generation with messages
 * const chatResult = await coreGenerateText({
 *   system: 'You are a helpful assistant',
 *   messages: [
 *     { role: 'user', content: 'Hello!' },
 *     { role: 'assistant', content: 'Hi there!' },
 *     { role: 'user', content: 'How are you?' },
 *   ],
 * })
 * ```
 */
export async function coreGenerateText(options: CoreGenerateTextOptions) {
  const {
    modelId = DEFAULT_CHAT_MODEL_ID,
    temperature = 0.7,
    system,
    maxTokens,
  } = options;

  const baseConfig = {
    model: openai(modelId),
    system,
    temperature,
    experimental_telemetry: telemetryConfig,
    ...(maxTokens && { maxOutputTokens: maxTokens }),
  };

  // Handle discriminated union - either prompt or messages
  const result =
    "prompt" in options
      ? await generateText({ ...baseConfig, prompt: options.prompt })
      : await generateText({ ...baseConfig, messages: options.messages });

  return result;
}
