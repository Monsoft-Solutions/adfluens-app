/**
 * Google Business Profile Review Type
 *
 * Represents a review on a GMB location.
 *
 * @module @repo/types/gmb/gmb-review
 */

import { z } from "zod";

/**
 * Star rating schema
 */
export const gmbStarRatingSchema = z.enum([
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
]);

export type GMBStarRating = z.infer<typeof gmbStarRatingSchema>;

/**
 * Reviewer schema
 */
export const gmbReviewerSchema = z.object({
  /** Display name of the reviewer */
  displayName: z.string(),

  /** Profile photo URL */
  profilePhotoUrl: z.string().optional(),

  /** Whether the reviewer is anonymous */
  isAnonymous: z.boolean(),
});

export type GMBReviewer = z.infer<typeof gmbReviewerSchema>;

/**
 * Review reply schema
 */
export const gmbReviewReplySchema = z.object({
  /** Reply comment text */
  comment: z.string(),

  /** When the reply was last updated */
  updateTime: z.string(),
});

export type GMBReviewReply = z.infer<typeof gmbReviewReplySchema>;

/**
 * Complete review schema
 */
export const gmbReviewSchema = z.object({
  /** Full resource name of the review */
  name: z.string(),

  /** Review ID extracted from the name */
  reviewId: z.string(),

  /** Reviewer information */
  reviewer: gmbReviewerSchema,

  /** Star rating (ONE through FIVE) */
  starRating: gmbStarRatingSchema,

  /** Review comment text */
  comment: z.string().optional(),

  /** When the review was created */
  createTime: z.string(),

  /** When the review was last updated */
  updateTime: z.string(),

  /** Owner's reply to the review, if any */
  reviewReply: gmbReviewReplySchema.optional(),
});

export type GMBReview = z.infer<typeof gmbReviewSchema>;

/**
 * Paginated list of reviews response schema
 */
export const gmbReviewsResponseSchema = z.object({
  /** List of reviews */
  reviews: z.array(gmbReviewSchema),

  /** Token for fetching the next page */
  nextPageToken: z.string().optional(),

  /** Average star rating across all reviews */
  averageRating: z.number().optional(),

  /** Total number of reviews */
  totalReviewCount: z.number().optional(),
});

export type GMBReviewsResponse = z.infer<typeof gmbReviewsResponseSchema>;

/**
 * Reply input schema
 */
export const gmbReplyInputSchema = z.object({
  /** Review ID to reply to */
  reviewId: z.string(),

  /** Reply comment text */
  comment: z.string(),
});

export type GMBReplyInput = z.infer<typeof gmbReplyInputSchema>;

// ============================================================================
// AI-Enhanced Review Types
// ============================================================================

/**
 * Review sentiment schema
 */
export const gmbReviewSentimentSchema = z.enum([
  "positive",
  "negative",
  "neutral",
]);

export type GMBReviewSentiment = z.infer<typeof gmbReviewSentimentSchema>;

/**
 * Tone options for AI-generated replies
 */
export const gmbReplyToneSchema = z.enum([
  "professional",
  "friendly",
  "empathetic",
]);

export type GMBReplyTone = z.infer<typeof gmbReplyToneSchema>;

/**
 * AI review analysis schema
 */
export const gmbReviewAnalysisSchema = z.object({
  /** Overall sentiment of the review */
  sentiment: gmbReviewSentimentSchema,

  /** Confidence score (0-1) */
  score: z.number().min(0).max(1),

  /** Key themes/topics mentioned in the review */
  keyThemes: z.array(z.string()),

  /** AI-suggested reply */
  suggestedReply: z.string(),
});

export type GMBReviewAnalysis = z.infer<typeof gmbReviewAnalysisSchema>;

/**
 * AI reply suggestion input schema
 */
export const gmbReplySuggestionInputSchema = z.object({
  /** Review ID */
  reviewId: z.string(),

  /** Optional tone for the reply */
  tone: gmbReplyToneSchema.optional(),
});

export type GMBReplySuggestionInput = z.infer<
  typeof gmbReplySuggestionInputSchema
>;
