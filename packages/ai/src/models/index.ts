/**
 * @repo/ai/models
 *
 * AI model definitions and utilities.
 *
 * @module @repo/ai/models
 */

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
} from "./available-models.constant";
