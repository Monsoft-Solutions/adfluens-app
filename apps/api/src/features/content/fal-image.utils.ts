/**
 * FAL.AI Image Generation Utilities
 *
 * Provides AI-powered image generation using fal.ai models.
 * Supports multiple models with model-specific API parameters.
 */

import { fal } from "@fal-ai/client";
import { env } from "@repo/env";
import { mediaStorage } from "@repo/media-storage";
import { Logger } from "@repo/logger";

import {
  getModelSizeConfig,
  DEFAULT_MODEL,
  DEFAULT_SIZE,
} from "./fal-models.config";
import type { GenerateImageInput, GeneratedImage } from "./fal-image.type";

const logger = new Logger({ context: "fal-image" });

// Re-export for external usage
export {
  FAL_MODEL_CONFIGS,
  type ImageModel,
  type ImageSize,
} from "./fal-models.config";
export type { GenerateImageInput, GeneratedImage } from "./fal-image.type";

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configure fal.ai client with API key
 */
function configureFalClient(): void {
  if (!env.FAL_AI_API_KEY) {
    throw new Error("FAL_AI_API_KEY is not configured");
  }

  fal.config({
    credentials: env.FAL_AI_API_KEY,
  });
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generate an image using fal.ai
 *
 * @param input - Generation parameters
 * @param organizationId - Organization ID for storage path
 * @returns Generated image with URLs and dimensions
 */
export async function generateImage(
  input: GenerateImageInput,
  organizationId: string
): Promise<GeneratedImage> {
  configureFalClient();

  const model = input.model || DEFAULT_MODEL;
  const size = input.size || DEFAULT_SIZE;
  const { modelConfig, sizeConfig } = getModelSizeConfig(model, size);

  // Build model-specific input
  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    negative_prompt: input.negativePrompt || modelConfig.defaultNegativePrompt,
    num_images: 1,
    output_format: "png",
  };

  // Add size parameter based on model's API requirements
  if (modelConfig.sizeParamType === "aspect_ratio") {
    falInput.aspect_ratio = sizeConfig.apiValue;
  } else {
    falInput.image_size = sizeConfig.apiValue;
  }

  // Call fal.ai API with correct model ID
  const result = (await fal.subscribe(modelConfig.falModelId, {
    input: falInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs
          .map((log) => log.message)
          .forEach((msg) => logger.debug(msg));
      }
    },
  })) as unknown as {
    data: {
      images: Array<{ url: string; width?: number; height?: number }>;
    };
    requestId: string;
  };

  if (!result.data?.images || result.data.images.length === 0) {
    throw new Error("No images generated");
  }

  const generatedImageUrl = result.data.images[0]!.url;

  // Upload to our storage
  const storedUrl = await mediaStorage.uploadFromUrl(
    generatedImageUrl,
    `content/${organizationId}/ai-generated`
  );

  return {
    url: generatedImageUrl,
    storedUrl,
    width: result.data.images[0]!.width || sizeConfig.width,
    height: result.data.images[0]!.height || sizeConfig.height,
    model,
  };
}

/**
 * Generate multiple images for selection
 *
 * @param input - Generation parameters
 * @param organizationId - Organization ID for storage path
 * @param count - Number of images to generate (1-4)
 * @returns Array of generated images
 */
export async function generateMultipleImages(
  input: GenerateImageInput,
  organizationId: string,
  count: number = 2
): Promise<GeneratedImage[]> {
  configureFalClient();

  const model = input.model || DEFAULT_MODEL;
  const size = input.size || DEFAULT_SIZE;
  const { modelConfig, sizeConfig } = getModelSizeConfig(model, size);

  // Limit count to 4
  const imageCount = Math.min(Math.max(count, 1), 4);

  // Build model-specific input
  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    negative_prompt: input.negativePrompt || modelConfig.defaultNegativePrompt,
    num_images: imageCount,
    output_format: "png",
  };

  logger.debug("Generating images with input", { falInput });

  // Add size parameter based on model's API requirements
  if (modelConfig.sizeParamType === "aspect_ratio") {
    falInput.aspect_ratio = sizeConfig.apiValue;
  } else {
    falInput.image_size = sizeConfig.apiValue;
  }

  // Call fal.ai API with correct model ID
  const result = (await fal.subscribe(modelConfig.falModelId, {
    input: falInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs
          .map((log) => log.message)
          .forEach((msg) => logger.debug(msg));
      }
    },
  })) as unknown as {
    data: {
      images: Array<{ url: string; width?: number; height?: number }>;
    };
    requestId: string;
  };

  logger.debug("Result", { result: JSON.stringify(result) });

  if (!result.data?.images || result.data.images.length === 0) {
    throw new Error("No images generated");
  }

  // Upload all images to storage in parallel
  const uploadPromises = result.data.images.map(async (image) => {
    const storedUrl = await mediaStorage.uploadFromUrl(
      image.url,
      `content/${organizationId}/ai-generated`
    );

    return {
      url: image.url,
      storedUrl,
      width: image.width || sizeConfig.width,
      height: image.height || sizeConfig.height,
      model,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * Check if fal.ai is configured
 */
export function isFalConfigured(): boolean {
  return !!env.FAL_AI_API_KEY;
}
