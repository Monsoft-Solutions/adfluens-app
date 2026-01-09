/**
 * Core Stream Text Function
 *
 * Wrapper for AI SDK streamText with centralized configuration.
 * Provides a single point for telemetry, error handling, and other cross-cutting concerns.
 *
 * @module @repo/ai/core/stream-text
 */
import { streamText, smoothStream } from "ai";
import { openai } from "@ai-sdk/openai";

import type { CoreStreamTextOptions } from "./types.core";
import { DEFAULT_CHAT_MODEL_ID } from "../models/available-models.constant";
import { telemetryConfig } from "../telemetry";

// Re-export result type for consumers
export type { StreamTextResult } from "ai";

/**
 * Stream text using AI
 *
 * Wraps the AI SDK streamText function with consistent configuration
 * and a centralized extension point for telemetry.
 *
 * @param options - Streaming options including messages and model config
 * @returns The streaming result with text as it's generated
 *
 * @example
 * ```typescript
 * const result = coreStreamText({
 *   system: 'You are a helpful assistant',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   modelId: 'gpt-4o',
 *   smoothStreaming: true,
 *   onFinish: async ({ text }) => {
 *     await saveMessage(text)
 *   },
 * })
 *
 * return result.toTextStreamResponse()
 * ```
 */
export function coreStreamText(options: CoreStreamTextOptions) {
  const {
    modelId = DEFAULT_CHAT_MODEL_ID,
    temperature = 0.7,
    system,
    messages,
    maxTokens,
    smoothStreaming = false,
    onFinish,
  } = options;

  // Build smooth stream transform if enabled
  const experimentalTransform = smoothStreaming
    ? smoothStream(
        typeof smoothStreaming === "object"
          ? {
              delayInMs: smoothStreaming.delayInMs ?? 10,
              chunking: smoothStreaming.chunking ?? "word",
            }
          : { chunking: "word" }
      )
    : undefined;

  const result = streamText({
    model: openai(modelId),
    system,
    messages,
    temperature,
    experimental_telemetry: telemetryConfig,
    ...(maxTokens && { maxOutputTokens: maxTokens }),
    ...(experimentalTransform && {
      experimental_transform: experimentalTransform,
    }),
    onFinish,
  });

  return result;
}
