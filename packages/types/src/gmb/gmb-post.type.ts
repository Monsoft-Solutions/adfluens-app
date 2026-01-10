/**
 * Google Business Profile Post Type
 *
 * Represents a local post on a GMB location.
 *
 * @module @repo/types/gmb/gmb-post
 */

import { z } from "zod";

/**
 * Post topic type schema
 */
export const gmbPostTopicTypeSchema = z.enum([
  "STANDARD",
  "EVENT",
  "OFFER",
  "PRODUCT",
]);

export type GMBPostTopicType = z.infer<typeof gmbPostTopicTypeSchema>;

/**
 * Post state schema
 */
export const gmbPostStateSchema = z.enum(["LIVE", "REJECTED", "PROCESSING"]);

export type GMBPostState = z.infer<typeof gmbPostStateSchema>;

/**
 * Media format schema
 */
export const gmbMediaFormatSchema = z.enum(["PHOTO", "VIDEO"]);

export type GMBMediaFormat = z.infer<typeof gmbMediaFormatSchema>;

/**
 * Call to action type schema
 */
export const gmbCallToActionTypeSchema = z.enum([
  "BOOK",
  "ORDER",
  "SHOP",
  "LEARN_MORE",
  "SIGN_UP",
  "GET_OFFER",
  "CALL",
]);

export type GMBCallToActionType = z.infer<typeof gmbCallToActionTypeSchema>;

/**
 * Media item schema
 */
export const gmbPostMediaSchema = z.object({
  /** Media format (PHOTO or VIDEO) */
  mediaFormat: gmbMediaFormatSchema,

  /** Source URL of the media */
  sourceUrl: z.string(),
});

export type GMBPostMedia = z.infer<typeof gmbPostMediaSchema>;

/**
 * Call to action schema
 */
export const gmbCallToActionSchema = z.object({
  /** Action type */
  actionType: gmbCallToActionTypeSchema,

  /** URL for the action */
  url: z.string().optional(),
});

export type GMBCallToAction = z.infer<typeof gmbCallToActionSchema>;

/**
 * Date part schema
 */
export const gmbDatePartSchema = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number(),
});

/**
 * Time part schema
 */
export const gmbTimePartSchema = z.object({
  hours: z.number(),
  minutes: z.number(),
});

/**
 * Event information schema
 */
export const gmbEventInfoSchema = z.object({
  /** Event title */
  title: z.string().optional(),

  /** Event start date */
  startDate: gmbDatePartSchema.optional(),

  /** Event end date */
  endDate: gmbDatePartSchema.optional(),

  /** Event start time */
  startTime: gmbTimePartSchema.optional(),

  /** Event end time */
  endTime: gmbTimePartSchema.optional(),
});

export type GMBEventInfo = z.infer<typeof gmbEventInfoSchema>;

/**
 * Offer information schema
 */
export const gmbOfferInfoSchema = z.object({
  /** Coupon code */
  couponCode: z.string().optional(),

  /** Redemption URL */
  redeemOnlineUrl: z.string().optional(),

  /** Terms and conditions */
  termsConditions: z.string().optional(),
});

export type GMBOfferInfo = z.infer<typeof gmbOfferInfoSchema>;

/**
 * Complete post schema
 */
export const gmbPostSchema = z.object({
  /** Full resource name of the post */
  name: z.string(),

  /** Language code */
  languageCode: z.string(),

  /** Post summary/body text */
  summary: z.string(),

  /** Call to action */
  callToAction: gmbCallToActionSchema.optional(),

  /** Media attachments */
  media: z.array(gmbPostMediaSchema).optional(),

  /** Post topic type */
  topicType: gmbPostTopicTypeSchema,

  /** When the post was created */
  createTime: z.string(),

  /** When the post was last updated */
  updateTime: z.string(),

  /** Post state */
  state: gmbPostStateSchema,

  /** Event information (for EVENT type posts) */
  event: gmbEventInfoSchema.optional(),

  /** Offer information (for OFFER type posts) */
  offer: gmbOfferInfoSchema.optional(),
});

export type GMBPost = z.infer<typeof gmbPostSchema>;

/**
 * Paginated list of posts response schema
 */
export const gmbPostsResponseSchema = z.object({
  /** List of posts */
  posts: z.array(gmbPostSchema),

  /** Token for fetching the next page */
  nextPageToken: z.string().optional(),
});

export type GMBPostsResponse = z.infer<typeof gmbPostsResponseSchema>;

/**
 * Create post input schema
 */
export const gmbCreatePostInputSchema = z.object({
  /** Post summary/body text */
  summary: z.string(),

  /** Post topic type (defaults to STANDARD) */
  topicType: gmbPostTopicTypeSchema.optional(),

  /** Call to action */
  callToAction: gmbCallToActionSchema.optional(),

  /** Media URLs to attach */
  mediaUrls: z.array(z.string()).optional(),

  /** Language code (defaults to "en") */
  languageCode: z.string().optional(),
});

export type GMBCreatePostInput = z.infer<typeof gmbCreatePostInputSchema>;
