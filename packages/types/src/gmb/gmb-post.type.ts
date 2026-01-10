/**
 * Google Business Profile Post Type
 *
 * Represents a local post on a GMB location.
 *
 * @module @repo/types/gmb/gmb-post
 */

/**
 * Post topic type
 */
export type GMBPostTopicType = "STANDARD" | "EVENT" | "OFFER" | "PRODUCT";

/**
 * Post state
 */
export type GMBPostState = "LIVE" | "REJECTED" | "PROCESSING";

/**
 * Media format
 */
export type GMBMediaFormat = "PHOTO" | "VIDEO";

/**
 * Call to action types
 */
export type GMBCallToActionType =
  | "BOOK"
  | "ORDER"
  | "SHOP"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "GET_OFFER"
  | "CALL";

/**
 * Media item in a post
 */
export type GMBPostMedia = {
  /** Media format (PHOTO or VIDEO) */
  mediaFormat: GMBMediaFormat;

  /** Source URL of the media */
  sourceUrl: string;
};

/**
 * Call to action for a post
 */
export type GMBCallToAction = {
  /** Action type */
  actionType: GMBCallToActionType;

  /** URL for the action */
  url?: string;
};

/**
 * Event information for EVENT type posts
 */
export type GMBEventInfo = {
  /** Event title */
  title?: string;

  /** Event start date/time */
  startDate?: {
    year: number;
    month: number;
    day: number;
  };

  /** Event end date/time */
  endDate?: {
    year: number;
    month: number;
    day: number;
  };

  /** Event start time */
  startTime?: {
    hours: number;
    minutes: number;
  };

  /** Event end time */
  endTime?: {
    hours: number;
    minutes: number;
  };
};

/**
 * Offer information for OFFER type posts
 */
export type GMBOfferInfo = {
  /** Coupon code */
  couponCode?: string;

  /** Redemption URL */
  redeemOnlineUrl?: string;

  /** Terms and conditions */
  termsConditions?: string;
};

/**
 * Complete post data from GMB API
 */
export type GMBPost = {
  /** Full resource name of the post */
  name: string;

  /** Language code */
  languageCode: string;

  /** Post summary/body text */
  summary: string;

  /** Call to action */
  callToAction?: GMBCallToAction;

  /** Media attachments */
  media?: GMBPostMedia[];

  /** Post topic type */
  topicType: GMBPostTopicType;

  /** When the post was created */
  createTime: string;

  /** When the post was last updated */
  updateTime: string;

  /** Post state */
  state: GMBPostState;

  /** Event information (for EVENT type posts) */
  event?: GMBEventInfo;

  /** Offer information (for OFFER type posts) */
  offer?: GMBOfferInfo;
};

/**
 * Paginated list of posts response
 */
export type GMBPostsResponse = {
  /** List of posts */
  posts: GMBPost[];

  /** Token for fetching the next page */
  nextPageToken?: string;
};

/**
 * Input for creating a new post
 */
export type GMBCreatePostInput = {
  /** Post summary/body text */
  summary: string;

  /** Post topic type (defaults to STANDARD) */
  topicType?: GMBPostTopicType;

  /** Call to action */
  callToAction?: GMBCallToAction;

  /** Media URLs to attach */
  mediaUrls?: string[];

  /** Language code (defaults to "en") */
  languageCode?: string;
};
