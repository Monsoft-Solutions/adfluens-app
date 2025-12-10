/**
 * @monsoft/ai
 *
 * AI utilities for structured outputs, text generation, and content analysis.
 * Built on top of the Vercel AI SDK.
 *
 * @module @monsoft/ai
 *
 * @example
 * ```typescript
 * // Import core AI functions
 * import { coreGenerateObject, coreGenerateText, coreStreamText } from '@monsoft/ai'
 *
 * // Import models
 * import { AVAILABLE_MODELS, DEFAULT_CHAT_MODEL_ID } from '@monsoft/ai/models'
 *
 * // Import extraction functions
 * import { extractOrganizationProfile } from '@monsoft/ai/functions'
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
  DEFAULT_DATA_EXTRACTION_MODEL_ID,
  getModelById,
  getRecommendedModels,
  getModelsByTier,
  isValidModelId,
  type AIModel,
  type ModelCapability,
  type ModelProvider,
  type ModelTier,
} from "./models";

// AI operation functions
export {
  extractOrganizationProfile,
  type ExtractOrganizationProfileOptions,
} from "./functions";

// Telemetry configuration
export { telemetryConfig } from "./telemetry";
