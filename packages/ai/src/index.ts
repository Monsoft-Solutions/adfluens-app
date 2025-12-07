/**
 * @repo/ai
 *
 * Centralized AI package for the YouTube Channel Analyzer application.
 * Consolidates all AI-related operations, models, prompts, and schemas.
 *
 * @module @repo/ai
 *
 * @example
 * ```typescript
 * // Import core AI functions
 * import { coreGenerateObject, coreGenerateText, coreStreamText } from '@repo/ai'
 *
 * // Import models
 * import { AVAILABLE_MODELS, DEFAULT_CHAT_MODEL_ID } from '@repo/ai/models'
 * ```
 */

// Core wrapper functions
export {
  coreGenerateObject,
  coreGenerateText,
  coreStreamObject,
  coreStreamText,
  type GenerateObjectResult,
  type FlexibleSchema,
  type InferSchema,
  type GenerateTextResult,
  type StreamObjectResult,
  type DeepPartial,
  type StreamTextResult,
  type CoreBaseOptions,
  type CoreMessage,
  type CoreGenerateObjectOptions,
  type CoreGenerateTextOptions,
  type CoreGenerateTextPromptOptions,
  type CoreGenerateTextMessagesOptions,
  type CoreStreamObjectOptions,
  type CoreStreamTextOptions,
} from "./core";

// Model definitions
export {
  AVAILABLE_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  DEFAULT_CLASSIFICATION_MODEL_ID,
  DEFAULT_CONVERSATION_ANALYSIS_MODEL_ID,
  DEFAULT_QUICK_QUESTIONS_MODEL_ID,
  DEFAULT_DEEP_DIVE_ANALYSIS_MODEL_ID,
  getModelById,
  getRecommendedModels,
  getModelsByTier,
  isValidModelId,
  type AIModel,
  type ModelCapability,
  type ModelProvider,
  type ModelTier,
} from "./models";

// Telemetry configuration
export { telemetryConfig } from "./telemetry";
