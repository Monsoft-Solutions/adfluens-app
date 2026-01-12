/**
 * FAL.AI Model Configurations
 *
 * Single source of truth for all image generation models.
 * Types are derived from this configuration.
 *
 * @see https://fal.ai/models/fal-ai/nano-banana-pro/api
 * @see https://fal.ai/models/fal-ai/gpt-image-1.5/api
 */

// =============================================================================
// Configuration (Source of Truth)
// =============================================================================

/**
 * How size parameter is sent to fal.ai API
 */
type SizeParamType = "aspect_ratio" | "image_size";

/**
 * All supported image generation models
 *
 * To add a new model:
 * 1. Add entry to this array
 * 2. Types update automatically
 * 3. Frontend options update via API
 */
export const FAL_MODEL_CONFIGS = [
  {
    value: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "Google's state-of-the-art image generation model",
    falModelId: "fal-ai/nano-banana-pro",
    sizeParamType: "aspect_ratio" as SizeParamType,
    defaultNegativePrompt: "blurry, low quality, distorted, ugly",
    sizes: [
      {
        value: "square",
        label: "Square (1:1)",
        apiValue: "1:1",
        width: 1024,
        height: 1024,
      },
      {
        value: "portrait",
        label: "Portrait (3:4)",
        apiValue: "3:4",
        width: 768,
        height: 1024,
      },
      {
        value: "landscape",
        label: "Landscape (4:3)",
        apiValue: "4:3",
        width: 1024,
        height: 768,
      },
    ],
  },
  {
    value: "gpt-image-1",
    label: "GPT Image 1.5",
    description: "Advanced AI image generation with detailed outputs",
    falModelId: "fal-ai/gpt-image-1.5",
    sizeParamType: "image_size" as SizeParamType,
    defaultNegativePrompt: "blurry, low quality, distorted",
    sizes: [
      {
        value: "square",
        label: "Square (1:1)",
        apiValue: "1024x1024",
        width: 1024,
        height: 1024,
      },
      {
        value: "portrait",
        label: "Portrait (2:3)",
        apiValue: "1024x1536",
        width: 1024,
        height: 1536,
      },
      {
        value: "landscape",
        label: "Landscape (3:2)",
        apiValue: "1536x1024",
        width: 1536,
        height: 1024,
      },
    ],
  },
] as const;

// =============================================================================
// Derived Types (Auto-generated from config)
// =============================================================================

/**
 * Valid image model identifiers
 * Derived from FAL_MODEL_CONFIGS[].value
 */
export type ImageModel = (typeof FAL_MODEL_CONFIGS)[number]["value"];
// Results in: "nano-banana-pro" | "gpt-image-1"

/**
 * Valid image size identifiers
 * Derived from all unique sizes across models
 */
export type ImageSize =
  (typeof FAL_MODEL_CONFIGS)[number]["sizes"][number]["value"];
// Results in: "square" | "portrait" | "landscape"

/**
 * Full model configuration type
 * Inferred from the config array structure
 */
export type FalModelConfig = (typeof FAL_MODEL_CONFIGS)[number];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get configuration for a specific model
 * @throws Error if model not found
 */
export function getModelConfig(model: ImageModel): FalModelConfig {
  const config = FAL_MODEL_CONFIGS.find((m) => m.value === model);
  if (!config) {
    throw new Error(`Unknown image model: ${model}`);
  }
  return config;
}

/**
 * Get size configuration for a model and size
 * @throws Error if size not found for model
 */
export function getModelSizeConfig(model: ImageModel, size: ImageSize) {
  const modelConfig = getModelConfig(model);
  const sizeConfig = modelConfig.sizes.find((s) => s.value === size);
  if (!sizeConfig) {
    throw new Error(`Size "${size}" not available for model "${model}"`);
  }
  return { modelConfig, sizeConfig };
}

/**
 * Get valid model values for Zod schema
 */
export function getValidModelValues(): [ImageModel, ...ImageModel[]] {
  return FAL_MODEL_CONFIGS.map((m) => m.value) as [ImageModel, ...ImageModel[]];
}

/**
 * Get valid size values for Zod schema
 */
export function getValidSizeValues(): [ImageSize, ...ImageSize[]] {
  const allSizes = new Set<ImageSize>();
  FAL_MODEL_CONFIGS.forEach((m) =>
    m.sizes.forEach((s) => allSizes.add(s.value as ImageSize))
  );
  return Array.from(allSizes) as [ImageSize, ...ImageSize[]];
}
/**
 * Default values
 */
export const DEFAULT_MODEL: ImageModel = "nano-banana-pro";
export const DEFAULT_SIZE: ImageSize = "square";
