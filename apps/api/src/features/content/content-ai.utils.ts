/**
 * Content AI Utilities
 *
 * AI-powered content generation for social media posts.
 * Uses @monsoft/ai package for caption generation and hashtag suggestions.
 */

import { coreGenerateText, coreGenerateObject } from "@monsoft/ai/core";
import { z } from "zod";
import { getAdapter } from "./platform-adapters";
import type { ImageModel } from "./fal-models.config";

// =============================================================================
// Types
// =============================================================================

export type CaptionTone =
  | "professional"
  | "casual"
  | "friendly"
  | "informative"
  | "engaging"
  | "witty";

export type GenerateCaptionInput = {
  topic: string;
  tone?: CaptionTone;
  platforms: string[];
  businessContext?: string;
  additionalInstructions?: string;
};

export type GenerateCaptionResult = {
  caption: string;
  platform: string;
}[];

export type SuggestHashtagsInput = {
  caption: string;
  platforms: string[];
  count?: number;
  topic?: string;
};

export type EnhanceCaptionInput = {
  originalCaption: string;
  platforms: string[];
  style?: "expand" | "condense" | "professional" | "engaging";
};

// =============================================================================
// Caption Generation
// =============================================================================

/**
 * Generate captions for social media posts
 *
 * @param input Generation parameters
 * @returns Array of captions for each platform
 */
export async function generateCaption(
  input: GenerateCaptionInput
): Promise<GenerateCaptionResult> {
  const {
    topic,
    tone = "engaging",
    platforms,
    businessContext,
    additionalInstructions,
  } = input;

  // Get the minimum max length across all platforms
  const minMaxLength = Math.min(
    ...platforms.map((p) => {
      try {
        return getAdapter(p).specs.maxCaptionLength;
      } catch {
        return 2200; // Default to Instagram's limit
      }
    })
  );

  const systemPrompt = `You are a social media content expert who creates engaging, authentic captions that drive engagement. Your captions should:
- Be written in a ${tone} tone
- Feel natural and human, not AI-generated
- Include a clear call-to-action when appropriate
- Be optimized for the target platforms: ${platforms.join(", ")}

${businessContext ? `Business context: ${businessContext}` : ""}
${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ""}`;

  const prompt = `Create a compelling social media caption about: ${topic}

Requirements:
- Maximum length: ${minMaxLength} characters
- The caption should work well on: ${platforms.join(", ")}
- Do NOT include hashtags in the caption (they will be added separately)

Write only the caption text, nothing else.`;

  const result = await coreGenerateText({
    modelId: "gpt-4.1-mini",
    temperature: 0.7,
    system: systemPrompt,
    prompt,
  });

  // Return the same caption for all platforms (trimmed to their limits)
  return platforms.map((platform) => {
    let caption = result.text.trim();
    try {
      const adapter = getAdapter(platform);
      if (caption.length > adapter.specs.maxCaptionLength) {
        caption = caption.slice(0, adapter.specs.maxCaptionLength - 3) + "...";
      }
    } catch {
      // Use as-is if adapter not found
    }
    return { platform, caption };
  });
}

/**
 * Generate multiple caption variations
 *
 * @param input Generation parameters
 * @param count Number of variations to generate
 * @returns Array of caption variations
 */
export async function generateCaptionVariations(
  input: GenerateCaptionInput,
  count: number = 3
): Promise<string[]> {
  const { topic, tone = "engaging", platforms, businessContext } = input;

  const minMaxLength = Math.min(
    ...platforms.map((p) => {
      try {
        return getAdapter(p).specs.maxCaptionLength;
      } catch {
        return 2200;
      }
    })
  );

  const variationsSchema = z.object({
    captions: z.array(z.string()).length(count),
  });

  const result = await coreGenerateObject({
    modelId: "gpt-4.1",
    temperature: 0.8,
    schema: variationsSchema,
    system: `You are a social media content expert. Create ${count} unique caption variations.`,
    prompt: `Create ${count} different caption variations about: ${topic}

Tone: ${tone}
Platforms: ${platforms.join(", ")}
Max length: ${minMaxLength} characters per caption
${businessContext ? `Business context: ${businessContext}` : ""}

Each caption should have a different angle or approach but all should be engaging and authentic.
Do NOT include hashtags in the captions.`,
  });

  return result.object.captions;
}

// =============================================================================
// Hashtag Suggestions
// =============================================================================

/**
 * Suggest relevant hashtags for a post
 *
 * @param input Suggestion parameters
 * @returns Array of suggested hashtags (without # symbol)
 */
export async function suggestHashtags(
  input: SuggestHashtagsInput
): Promise<string[]> {
  const { caption, platforms, count = 15, topic } = input;

  // Get the minimum max hashtags across all platforms
  const maxHashtags = Math.min(
    count,
    ...platforms.map((p) => {
      try {
        return getAdapter(p).specs.maxHashtags;
      } catch {
        return 30;
      }
    })
  );

  const hashtagsSchema = z.object({
    hashtags: z.array(z.string()).max(maxHashtags),
  });

  const result = await coreGenerateObject({
    modelId: "gpt-4.1-mini",
    temperature: 0.5,
    schema: hashtagsSchema,
    system: `You are a social media hashtag expert. You suggest relevant, effective hashtags that help content get discovered.`,
    prompt: `Suggest ${maxHashtags} relevant hashtags for this social media caption:

Caption: "${caption}"
${topic ? `Topic: ${topic}` : ""}
Platforms: ${platforms.join(", ")}

Guidelines:
- Return only the hashtag words WITHOUT the # symbol
- Include a mix of popular hashtags (for reach) and niche hashtags (for engagement)
- Make hashtags relevant to the content
- Use lowercase, no spaces (camelCase for multi-word hashtags)
- Avoid overly generic hashtags like "love" or "happy"`,
  });

  // Clean up hashtags (remove any # symbols, spaces, etc.)
  return result.object.hashtags.map((tag) =>
    tag.replace(/^#/, "").replace(/\s+/g, "").toLowerCase()
  );
}

// =============================================================================
// Caption Enhancement
// =============================================================================

/**
 * Enhance an existing caption
 *
 * @param input Enhancement parameters
 * @returns Enhanced caption
 */
export async function enhanceCaption(
  input: EnhanceCaptionInput
): Promise<string> {
  const { originalCaption, platforms, style = "engaging" } = input;

  const minMaxLength = Math.min(
    ...platforms.map((p) => {
      try {
        return getAdapter(p).specs.maxCaptionLength;
      } catch {
        return 2200;
      }
    })
  );

  const styleInstructions = {
    expand:
      "Expand this caption with more detail and context while keeping it engaging.",
    condense:
      "Make this caption more concise while preserving the key message.",
    professional:
      "Rewrite this caption in a more professional, business-appropriate tone.",
    engaging:
      "Make this caption more engaging and likely to drive interactions.",
  };

  const result = await coreGenerateText({
    modelId: "gpt-4.1",
    temperature: 0.6,
    system: `You are a social media content editor. Improve captions while maintaining their core message.`,
    prompt: `${styleInstructions[style]}

Original caption: "${originalCaption}"

Requirements:
- Maximum length: ${minMaxLength} characters
- Keep any existing hashtags if present
- Maintain the original intent of the message
- Make it suitable for: ${platforms.join(", ")}

Write only the enhanced caption, nothing else.`,
  });

  let enhanced = result.text.trim();

  // Ensure it fits within limits
  if (enhanced.length > minMaxLength) {
    enhanced = enhanced.slice(0, minMaxLength - 3) + "...";
  }

  return enhanced;
}

// =============================================================================
// Content Ideas
// =============================================================================

/**
 * Generate content ideas for a topic
 *
 * @param topic The topic or theme to generate ideas for
 * @param count Number of ideas to generate
 * @returns Array of content ideas
 */
export async function generateContentIdeas(
  topic: string,
  count: number = 5
): Promise<string[]> {
  const ideasSchema = z.object({
    ideas: z.array(z.string()).length(count),
  });

  const result = await coreGenerateObject({
    modelId: "gpt-4.1",
    temperature: 0.8,
    schema: ideasSchema,
    system: `You are a creative social media strategist who generates engaging content ideas.`,
    prompt: `Generate ${count} unique social media post ideas about: ${topic}

Each idea should:
- Be specific and actionable (not vague)
- Have potential for high engagement
- Be suitable for image-based posts on Facebook and Instagram
- Include a hook or angle that makes it interesting

Format each idea as a brief description (1-2 sentences).`,
  });

  return result.object.ideas;
}

// =============================================================================
// Image Prompt Expansion
// =============================================================================

export type ExpandIdeaToPromptInput = {
  idea: string;
  model: ImageModel;
};

export type ExpandIdeaToPromptResult = {
  prompt: string;
  negativePrompt: string;
};

/**
 * Expand a simple idea into an optimized image generation prompt
 *
 * Applies model-specific best practices based on research:
 * - Nano Banana Pro (Google/Gemini): Professional photography terms, color grading, complex compositions
 * - GPT-Image-1.5 (OpenAI): Front-loaded subject, conversational language, strong instruction following
 *
 * @param input - The idea and target model
 * @returns Optimized prompt and negative prompt
 */
export async function expandIdeaToPrompt(
  input: ExpandIdeaToPromptInput
): Promise<ExpandIdeaToPromptResult> {
  const { idea, model } = input;

  // Model-specific guidance based on research
  const guidance =
    model === "nano-banana-pro"
      ? `You are optimizing a prompt for Nano Banana Pro (Google's Gemini-based image model).

STRUCTURE: "[Subject] in [setting/environment]. [Lighting and camera details]. [Style and mood]."

BEST PRACTICES:
- Use professional photography terms: "shallow depth of field", "soft diffused lighting", "low angle perspective"
- Specify color grading: "warm golden tones", "high contrast", "muted earth palette"
- Include camera/framing: "close-up portrait", "wide establishing shot", "eye-level angle"
- For text in images: use quotes like 'text "HELLO" on wooden sign'
- Be specific about materials: "brushed metal", "weathered wood", "matte ceramic"
- Describe atmosphere: "cozy", "dramatic", "ethereal", "vibrant"

EXAMPLE:
Input: "coffee shop"
Output: "Cozy artisan coffee shop interior with exposed brick walls and hanging Edison bulbs. Soft morning light streaming through large windows, shallow depth of field focusing on a steaming ceramic cup on a reclaimed wood table. Warm golden tones with hints of green from potted plants, inviting and intimate atmosphere."`
      : `You are optimizing a prompt for GPT-Image-1.5 (OpenAI's latest image generation model).

STRUCTURE: Put the main subject FIRST, then add environment and details.

BEST PRACTICES:
- Front-load the subject: "A barista preparing espresso..." not "In a coffee shop, there is a barista..."
- Use clear, descriptive language (conversational, not keyword lists)
- For text in images: 'text "YOUR TEXT" displayed on [surface]'
- Include composition: "close-up", "centered", "wide shot", "overhead view"
- Specify lighting: "natural window light", "neon glow", "dramatic shadows"
- Describe mood explicitly: "cheerful", "mysterious", "professional"`;

  const result = await coreGenerateText({
    modelId: "gpt-4.1",
    temperature: 0.7,
    system: `You are an expert at writing image generation prompts. Transform simple ideas into detailed, model-optimized prompts. Your output shouild be in raw markdown, with no additional formatting or explanations.`,
    prompt: `${guidance}

---

Transform this idea into an optimized prompt (60-120 words):

Idea: "${idea}"

Return ONLY the prompt text, no explanations.`,
  });

  // Model-specific negative prompts
  const negativePrompt =
    model === "nano-banana-pro"
      ? "blurry, low quality, distorted, ugly, text overlay, watermark, logo, signature, oversaturated"
      : "";

  return {
    prompt: result.text.trim(),
    negativePrompt,
  };
}
