/**
 * Content Post Types
 *
 * Types for creating and managing social media content posts.
 */

import { z } from "zod";

// =============================================================================
// Status
// =============================================================================

export const contentPostStatusSchema = z.enum([
  "draft",
  "pending",
  "published",
  "failed",
]);
export type ContentPostStatus = z.infer<typeof contentPostStatusSchema>;

// =============================================================================
// Media Source
// =============================================================================

export const contentMediaSourceSchema = z.enum([
  "upload",
  "fal_generated",
  "url",
]);
export type ContentMediaSource = z.infer<typeof contentMediaSourceSchema>;

// =============================================================================
// Media
// =============================================================================

export const contentPostMediaSchema = z.object({
  /** Original URL (user-provided or generated) */
  url: z.string().url(),
  /** Stored URL in GCS after upload */
  storedUrl: z.string().url().optional(),
  /** Image width in pixels */
  width: z.number().int().positive().optional(),
  /** Image height in pixels */
  height: z.number().int().positive().optional(),
  /** Alt text for accessibility */
  altText: z.string().max(500).optional(),
  /** MIME type of the media */
  mimeType: z.string().optional(),
  /** How the media was sourced */
  source: contentMediaSourceSchema,
});
export type ContentPostMedia = z.infer<typeof contentPostMediaSchema>;

// =============================================================================
// Publish Result (per platform)
// =============================================================================

export const contentPostPublishResultSchema = z.object({
  /** Platform-specific post ID */
  postId: z.string().optional(),
  /** Permalink to the published post */
  permalink: z.string().url().optional(),
  /** Error message if publishing failed */
  error: z.string().optional(),
  /** When the post was published */
  publishedAt: z.string().datetime().optional(),
});
export type ContentPostPublishResult = z.infer<
  typeof contentPostPublishResultSchema
>;

// =============================================================================
// Platform Schemas
// =============================================================================

/**
 * Phase 1 Platform Schema (Facebook, Instagram only)
 * @deprecated Use contentPlatformSchema for new code
 */
export const phase1PlatformSchema = z.enum(["facebook", "instagram"]);
export type Phase1Platform = z.infer<typeof phase1PlatformSchema>;

/**
 * All supported content platforms
 */
export const contentPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "gmb",
  "linkedin",
  "twitter",
]);
export type ContentPlatform = z.infer<typeof contentPlatformSchema>;

// =============================================================================
// Content Post
// =============================================================================

export const contentPostSchema = z.object({
  /** Unique identifier */
  id: z.string().uuid(),
  /** Organization that owns this post */
  organizationId: z.string(),
  /** Target platforms for publishing */
  platforms: z.array(contentPlatformSchema),
  /** Post caption/text content */
  caption: z.string(),
  /** Hashtags (without # symbol) */
  hashtags: z.array(z.string()).optional(),
  /** Media attachments */
  media: z.array(contentPostMediaSchema),
  /** Current status of the post */
  status: contentPostStatusSchema,
  /** Results from publishing to each platform (legacy) */
  publishResults: z
    .record(z.string(), contentPostPublishResultSchema)
    .optional(),
  /** User who created the post */
  createdByUserId: z.string(),
  /** When the post was created */
  createdAt: z.string().datetime(),
  /** When the post was last updated */
  updatedAt: z.string().datetime(),
});
export type ContentPost = z.infer<typeof contentPostSchema>;

// =============================================================================
// Create Input
// =============================================================================

/**
 * Legacy create input (Phase 1 - Meta only)
 * @deprecated Use contentPostCreateInputV2Schema for new code
 */
export const contentPostCreateInputSchema = z.object({
  /** Target platforms for publishing */
  platforms: z
    .array(phase1PlatformSchema)
    .min(1, "Select at least one platform"),
  /** Meta page ID (required for Facebook/Instagram in Phase 1) */
  pageId: z.string().uuid("Invalid page ID"),
  /** Post caption/text content */
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(63206, "Caption exceeds maximum length"),
  /** Hashtags (without # symbol) */
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  /** Media attachments */
  media: z
    .array(contentPostMediaSchema)
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
});
export type ContentPostCreateInput = z.infer<
  typeof contentPostCreateInputSchema
>;

/**
 * V2 create input - supports multi-platform accounts
 */
export const contentPostCreateInputV2Schema = z.object({
  /** Platform connection IDs to publish to */
  accountIds: z.array(z.string().uuid()).min(1, "Select at least one account"),
  /** Post caption/text content */
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(63206, "Caption exceeds maximum length"),
  /** Hashtags (without # symbol) */
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  /** Media attachments */
  media: z
    .array(contentPostMediaSchema)
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
});
export type ContentPostCreateInputV2 = z.infer<
  typeof contentPostCreateInputV2Schema
>;

// =============================================================================
// Update Input
// =============================================================================

export const contentPostUpdateInputSchema = z.object({
  /** Post ID to update */
  postId: z.string().uuid(),
  /** Updated caption */
  caption: z.string().min(1).max(63206).optional(),
  /** Updated hashtags */
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  /** Updated media */
  media: z.array(contentPostMediaSchema).min(1).max(10).optional(),
});
export type ContentPostUpdateInput = z.infer<
  typeof contentPostUpdateInputSchema
>;

// =============================================================================
// List Input
// =============================================================================

export const contentPostListInputSchema = z.object({
  /** Filter by status */
  status: contentPostStatusSchema.optional(),
  /** Filter by Meta page ID (legacy) */
  pageId: z.string().uuid().optional(),
  /** Filter by platform */
  platform: contentPlatformSchema.optional(),
  /** Filter by platform connection ID */
  accountId: z.string().uuid().optional(),
  /** Number of posts to return */
  limit: z.number().int().min(1).max(100).default(20),
  /** Cursor for pagination */
  cursor: z.string().optional(),
});
export type ContentPostListInput = z.infer<typeof contentPostListInputSchema>;
