/**
 * GMB AI Utilities
 *
 * AI-powered functions for review analysis and response generation.
 */

import { coreGenerateText, coreGenerateObject } from "@monsoft/ai/core";
import { z } from "zod";
import type {
  GMBReview,
  GMBReviewAnalysis,
  GMBReplyTone,
} from "@repo/types/gmb/gmb-review.type";

// ============================================================================
// Review Reply Generation
// ============================================================================

/**
 * Generate an AI-suggested reply for a review
 */
export async function generateReviewReply(
  review: GMBReview,
  businessName: string,
  tone: GMBReplyTone = "professional"
): Promise<string> {
  const starRating = starRatingToNumber(review.starRating);
  const isPositive = starRating >= 4;
  const isNegative = starRating <= 2;

  const toneGuidelines = {
    professional: "Use professional, business-appropriate language.",
    friendly:
      "Use warm, approachable language while maintaining professionalism.",
    empathetic:
      "Show genuine empathy and understanding, especially for concerns raised.",
  };

  const systemPrompt = `You are a customer service expert writing responses to Google Business Profile reviews for "${businessName}".

Guidelines:
- Keep responses concise (2-4 sentences)
- ${toneGuidelines[tone]}
- Personalize the response based on the review content
- ${isPositive ? "Thank the customer genuinely and encourage future visits" : ""}
- ${isNegative ? "Apologize sincerely, acknowledge concerns, and offer to make things right" : ""}
- Never be defensive or argumentative
- Don't use excessive exclamation marks
- Sign off naturally without excessive formality

Do NOT include any greeting like "Dear [name]" - start directly with the response content.`;

  const reviewContent = review.comment
    ? `Review (${starRating} stars): "${review.comment}"`
    : `Review (${starRating} stars, no comment)`;

  const result = await coreGenerateText({
    system: systemPrompt,
    prompt: `Write a ${tone} response to this review:\n\n${reviewContent}`,
  });

  return result.text.trim();
}

// ============================================================================
// Review Analysis
// ============================================================================

/**
 * Analyze a review for sentiment and key themes
 */
export async function analyzeReview(
  review: GMBReview,
  businessName: string
): Promise<GMBReviewAnalysis> {
  const starRating = starRatingToNumber(review.starRating);

  // For reviews without comments, derive analysis from star rating
  if (!review.comment) {
    const sentiment =
      starRating >= 4 ? "positive" : starRating <= 2 ? "negative" : "neutral";
    const suggestedReply = await generateReviewReply(
      review,
      businessName,
      sentiment === "negative" ? "empathetic" : "friendly"
    );

    return {
      sentiment,
      score: starRating / 5,
      keyThemes: [],
      suggestedReply,
    };
  }

  const schema = z.object({
    sentiment: z.enum(["positive", "negative", "neutral"]),
    score: z.number().min(0).max(1),
    keyThemes: z.array(z.string()),
  });

  const result = await coreGenerateObject({
    schema,
    system: `You are analyzing customer reviews for "${businessName}".
Analyze the review and return:
- sentiment: "positive", "negative", or "neutral"
- score: confidence score from 0 (very negative) to 1 (very positive)
- keyThemes: array of 1-3 key topics mentioned (e.g., "service", "wait time", "food quality")

Consider both the star rating and the comment content.`,
    prompt: `Review (${starRating} stars): "${review.comment}"`,
  });

  // Generate a suggested reply based on the analysis
  const tone: GMBReplyTone =
    result.object.sentiment === "negative" ? "empathetic" : "friendly";
  const suggestedReply = await generateReviewReply(review, businessName, tone);

  return {
    sentiment: result.object.sentiment,
    score: result.object.score,
    keyThemes: result.object.keyThemes,
    suggestedReply,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert GMB star rating string to number
 */
function starRatingToNumber(rating: GMBReview["starRating"]): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 3;
}
