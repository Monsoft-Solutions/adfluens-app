/**
 * FAL.AI Image Generation Types
 *
 * Type definitions for image generation input and output structures.
 */

import type { ImageModel, ImageSize } from "./fal-models.config";

/**
 * Input for image generation functions
 */
export type GenerateImageInput = {
  prompt: string;
  model?: ImageModel;
  size?: ImageSize;
  negativePrompt?: string;
};

/**
 * Result of image generation
 */
export type GeneratedImage = {
  url: string;
  storedUrl: string;
  width: number;
  height: number;
  model: ImageModel;
};
