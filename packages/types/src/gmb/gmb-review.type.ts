/**
 * Google Business Profile Review Type
 *
 * Represents a review on a GMB location.
 *
 * @module @repo/types/gmb/gmb-review
 */

/**
 * Star rating values from GMB API
 */
export type GMBStarRating = "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";

/**
 * Reviewer information
 */
export type GMBReviewer = {
  /** Display name of the reviewer */
  displayName: string;

  /** Profile photo URL */
  profilePhotoUrl?: string;

  /** Whether the reviewer is anonymous */
  isAnonymous: boolean;
};

/**
 * Reply to a review
 */
export type GMBReviewReply = {
  /** Reply comment text */
  comment: string;

  /** When the reply was last updated */
  updateTime: string;
};

/**
 * Complete review data from GMB API
 */
export type GMBReview = {
  /** Full resource name of the review */
  name: string;

  /** Review ID extracted from the name */
  reviewId: string;

  /** Reviewer information */
  reviewer: GMBReviewer;

  /** Star rating (ONE through FIVE) */
  starRating: GMBStarRating;

  /** Review comment text */
  comment?: string;

  /** When the review was created */
  createTime: string;

  /** When the review was last updated */
  updateTime: string;

  /** Owner's reply to the review, if any */
  reviewReply?: GMBReviewReply;
};

/**
 * Paginated list of reviews response
 */
export type GMBReviewsResponse = {
  /** List of reviews */
  reviews: GMBReview[];

  /** Token for fetching the next page */
  nextPageToken?: string;

  /** Average star rating across all reviews */
  averageRating?: number;

  /** Total number of reviews */
  totalReviewCount?: number;
};

/**
 * Input for replying to a review
 */
export type GMBReplyInput = {
  /** Review ID to reply to */
  reviewId: string;

  /** Reply comment text */
  comment: string;
};
