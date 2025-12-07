/**
 * @repo/ai/core
 *
 * Core AI wrapper functions for centralized configuration and telemetry.
 * Use these functions instead of directly importing from 'ai' package.
 *
 * @module @repo/ai/core
 *
 * @example
 * ```typescript
 * import {
 *   coreGenerateObject,
 *   coreGenerateText,
 *   coreStreamObject,
 *   coreStreamText,
 * } from '@repo/ai/core'
 *
 * // Generate structured output
 * const result = await coreGenerateObject({
 *   schema: mySchema,
 *   system: 'You are helpful',
 *   prompt: 'Extract data from...',
 * })
 *
 * // Stream text response
 * const stream = coreStreamText({
 *   system: 'You are helpful',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   smoothStreaming: true,
 * })
 * ```
 */

// Core wrapper functions
export {
  coreGenerateObject,
  type GenerateObjectResult,
  type FlexibleSchema,
  type InferSchema,
} from "./generate-object.core";
export {
  coreGenerateText,
  type GenerateTextResult,
} from "./generate-text.core";
export {
  coreStreamObject,
  type StreamObjectResult,
  type DeepPartial,
} from "./stream-object.core";
export { coreStreamText, type StreamTextResult } from "./stream-text.core";

// Types
export type {
  CoreBaseOptions,
  CoreMessage,
  CoreGenerateObjectOptions,
  CoreGenerateTextOptions,
  CoreGenerateTextPromptOptions,
  CoreGenerateTextMessagesOptions,
  CoreStreamObjectOptions,
  CoreStreamTextOptions,
} from "./types.core";
