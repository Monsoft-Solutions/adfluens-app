/**
 * Content Router
 *
 * tRPC endpoints for creating, managing, and publishing content posts.
 */

import { z } from "zod";
import { router, organizationProcedure } from "../../trpc/init";
import {
  contentPostMediaSchema,
  contentPostListInputSchema,
  phase1PlatformSchema,
} from "@repo/types/content/content-post.type";
import * as contentService from "./content.service";
import * as contentAiUtils from "./content-ai.utils";
import * as falImageUtils from "./fal-image.utils";
import {
  FAL_MODEL_CONFIGS,
  getValidModelValues,
  getValidSizeValues,
  DEFAULT_MODEL,
  DEFAULT_SIZE,
} from "./fal-models.config";

// =============================================================================
// Router Definition
// =============================================================================

export const contentRouter = router({
  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  /**
   * Create a new content post (draft)
   */
  create: organizationProcedure
    .input(
      z.object({
        platforms: z
          .array(phase1PlatformSchema)
          .min(1, "Select at least one platform"),
        pageId: z.string().uuid("Invalid page ID"),
        caption: z
          .string()
          .min(1, "Caption is required")
          .max(63206, "Caption exceeds maximum length"),
        hashtags: z.array(z.string().max(100)).max(30).optional(),
        media: z
          .array(contentPostMediaSchema)
          .min(1, "At least one image is required")
          .max(10, "Maximum 10 images allowed"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return contentService.createPost(input, ctx.organization.id, ctx.user.id);
    }),

  /**
   * Get a single post by ID
   */
  get: organizationProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      return contentService.getPost(input.postId, ctx.organization.id);
    }),

  /**
   * List posts for the organization
   */
  list: organizationProcedure
    .input(contentPostListInputSchema.optional())
    .query(async ({ input, ctx }) => {
      return contentService.listPosts(ctx.organization.id, input);
    }),

  /**
   * Update a draft post
   */
  update: organizationProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        caption: z.string().min(1).max(63206).optional(),
        hashtags: z.array(z.string().max(100)).max(30).optional(),
        media: z.array(contentPostMediaSchema).min(1).max(10).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { postId, ...updates } = input;
      return contentService.updatePost(postId, ctx.organization.id, updates);
    }),

  /**
   * Delete a post
   */
  delete: organizationProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await contentService.deletePost(input.postId, ctx.organization.id);
      return { success: true };
    }),

  // ===========================================================================
  // Publishing
  // ===========================================================================

  /**
   * Publish a post to all selected platforms
   */
  publish: organizationProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return contentService.publishPost(input.postId, ctx.organization.id);
    }),

  // ===========================================================================
  // Validation & Platform Info
  // ===========================================================================

  /**
   * Validate a post against platform requirements
   */
  validatePost: organizationProcedure
    .input(
      z.object({
        platforms: z.array(phase1PlatformSchema).min(1),
        caption: z.string(),
        hashtags: z.array(z.string()).optional(),
        media: z.array(contentPostMediaSchema),
      })
    )
    .query(({ input }) => {
      return contentService.validatePost(input);
    }),

  /**
   * Get specifications for all supported platforms
   */
  getPlatformSpecs: organizationProcedure.query(() => {
    return contentService.getPlatformSpecs();
  }),

  // ===========================================================================
  // Media Upload
  // ===========================================================================

  /**
   * Upload media from a URL to storage
   */
  uploadMediaFromUrl: organizationProcedure
    .input(
      z.object({
        sourceUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return contentService.uploadMediaFromUrl(
        ctx.organization.id,
        input.sourceUrl
      );
    }),

  // ===========================================================================
  // AI Features
  // ===========================================================================

  /**
   * Generate a caption for social media posts
   */
  generateCaption: organizationProcedure
    .input(
      z.object({
        topic: z.string().min(1, "Topic is required"),
        tone: z
          .enum([
            "professional",
            "casual",
            "friendly",
            "informative",
            "engaging",
            "witty",
          ])
          .optional(),
        platforms: z.array(phase1PlatformSchema).min(1),
        businessContext: z.string().optional(),
        additionalInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return contentAiUtils.generateCaption(input);
    }),

  /**
   * Generate multiple caption variations
   */
  generateCaptionVariations: organizationProcedure
    .input(
      z.object({
        topic: z.string().min(1),
        tone: z
          .enum([
            "professional",
            "casual",
            "friendly",
            "informative",
            "engaging",
            "witty",
          ])
          .optional(),
        platforms: z.array(phase1PlatformSchema).min(1),
        businessContext: z.string().optional(),
        count: z.number().int().min(1).max(5).default(3),
      })
    )
    .mutation(async ({ input }) => {
      const { count, ...captionInput } = input;
      return contentAiUtils.generateCaptionVariations(captionInput, count);
    }),

  /**
   * Suggest hashtags for a caption
   */
  suggestHashtags: organizationProcedure
    .input(
      z.object({
        caption: z.string().min(1, "Caption is required"),
        platforms: z.array(phase1PlatformSchema).min(1),
        count: z.number().int().min(1).max(30).default(15),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return contentAiUtils.suggestHashtags(input);
    }),

  /**
   * Enhance an existing caption
   */
  enhanceCaption: organizationProcedure
    .input(
      z.object({
        originalCaption: z.string().min(1, "Caption is required"),
        platforms: z.array(phase1PlatformSchema).min(1),
        style: z
          .enum(["expand", "condense", "professional", "engaging"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return contentAiUtils.enhanceCaption(input);
    }),

  /**
   * Generate content ideas for a topic
   */
  generateContentIdeas: organizationProcedure
    .input(
      z.object({
        topic: z.string().min(1, "Topic is required"),
        count: z.number().int().min(1).max(10).default(5),
      })
    )
    .mutation(async ({ input }) => {
      return contentAiUtils.generateContentIdeas(input.topic, input.count);
    }),

  // ===========================================================================
  // AI Image Generation
  // ===========================================================================

  /**
   * Check if AI image generation is available
   */
  isImageGenerationAvailable: organizationProcedure.query(() => {
    return { available: falImageUtils.isFalConfigured() };
  }),

  /**
   * Get available image generation models and sizes
   */
  getImageGenerationOptions: organizationProcedure.query(() => {
    const available = falImageUtils.isFalConfigured();

    if (!available) {
      return { available: false, models: [] };
    }

    return {
      available: true,
      models: FAL_MODEL_CONFIGS.map((config) => ({
        value: config.value,
        label: config.label,
        description: config.description,
        sizes: config.sizes.map((size) => ({
          value: size.value,
          label: size.label,
        })),
      })),
    };
  }),

  /**
   * Generate a single AI image
   */
  generateImage: organizationProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt is required").max(1000),
        model: z.enum(getValidModelValues()).default(DEFAULT_MODEL),
        size: z.enum(getValidSizeValues()).default(DEFAULT_SIZE),
        negativePrompt: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return falImageUtils.generateImage(input, ctx.organization.id);
    }),

  /**
   * Generate multiple AI images for selection
   */
  generateMultipleImages: organizationProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt is required").max(1000),
        model: z.enum(getValidModelValues()).default(DEFAULT_MODEL),
        size: z.enum(getValidSizeValues()).default(DEFAULT_SIZE),
        negativePrompt: z.string().max(500).optional(),
        count: z.number().int().min(1).max(4).default(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { count, ...generateInput } = input;
      return falImageUtils.generateMultipleImages(
        generateInput,
        ctx.organization.id,
        count
      );
    }),

  /**
   * Optimize an idea into a detailed image generation prompt
   *
   * Takes a simple idea and expands it into an optimized prompt based on model best practices.
   * Returns both the main prompt and negative prompt.
   */
  optimizeImagePrompt: organizationProcedure
    .input(
      z.object({
        idea: z.string().min(1, "Describe your image").max(500),
        model: z.enum(getValidModelValues()).default(DEFAULT_MODEL),
        // Advanced style options
        style: z
          .enum([
            "photorealistic",
            "illustration",
            "3d-render",
            "flat-design",
            "watercolor",
            "cinematic",
          ])
          .optional(),
        mood: z
          .enum([
            "vibrant",
            "moody",
            "professional",
            "playful",
            "calm",
            "luxurious",
          ])
          .optional(),
        composition: z
          .enum(["closeup", "wide", "overhead", "centered", "rule-of-thirds"])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await contentAiUtils.expandIdeaToPrompt({
        idea: input.idea,
        model: input.model,
        style: input.style,
        mood: input.mood,
        composition: input.composition,
      });
      return { prompt: result.prompt, negativePrompt: result.negativePrompt };
    }),

  /**
   * Generate images from a prompt
   *
   * Takes a direct prompt (can be user-typed or AI-optimized) and generates images.
   */
  generateFromIdea: organizationProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Provide an image prompt").max(2000),
        negativePrompt: z.string().max(1000).optional(),
        model: z.enum(getValidModelValues()).default(DEFAULT_MODEL),
        size: z.enum(getValidSizeValues()).default(DEFAULT_SIZE),
        count: z.number().int().min(1).max(4).default(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Generate images directly from the provided prompt
      const images = await falImageUtils.generateMultipleImages(
        {
          prompt: input.prompt,
          negativePrompt: input.negativePrompt,
          model: input.model,
          size: input.size,
        },
        ctx.organization.id,
        input.count
      );

      return { prompt: input.prompt, images };
    }),
});
