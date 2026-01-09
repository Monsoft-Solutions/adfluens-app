/**
 * Core Generate Object Function
 *
 * Wrapper for AI SDK generateObject with centralized configuration.
 * Provides a single point for telemetry, error handling, and other cross-cutting concerns.
 *
 * @module @repo/ai/core/generate-object
 */
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import type { z } from "zod";

import type { CoreGenerateObjectOptions } from "./types.core";
import { DEFAULT_CHAT_MODEL_ID } from "../models/available-models.constant";
import { telemetryConfig } from "../telemetry";

// Re-export result types for consumers
export type { GenerateObjectResult } from "ai";
export type { FlexibleSchema, InferSchema } from "@ai-sdk/provider-utils";

/**
 * Generate a structured object using AI
 *
 * Wraps the AI SDK generateObject function with consistent configuration
 * and a centralized extension point for telemetry.
 *
 * @param options - Generation options including schema, prompts, and model config
 * @returns The generated object matching the schema type
 *
 * @example
 * ```typescript
 * const result = await coreGenerateObject({
 *   schema: myZodSchema,
 *   system: 'You are a helpful assistant',
 *   prompt: 'Extract the user info from: John Doe, 30 years old',
 *   modelId: 'gpt-4o-mini',
 *   temperature: 0.3,
 * })
 * console.log(result.object) // Typed object matching schema
 * ```
 */
export async function coreGenerateObject<TSchema extends z.ZodType>(
  options: CoreGenerateObjectOptions<TSchema>
) {
  const {
    modelId = DEFAULT_CHAT_MODEL_ID,
    temperature = 0.7,
    schema,
    system,
    prompt,
  } = options;

  const result = await generateObject({
    model: openai(modelId),
    schema,
    system,
    prompt,
    temperature,
    experimental_telemetry: telemetryConfig,
  });

  return result;
}
