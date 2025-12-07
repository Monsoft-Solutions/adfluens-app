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
} from "./available-models.constant";
