/**
 * Content Creation Enums
 *
 * PostgreSQL native enums for content publishing tables.
 * Using pgEnum provides database-level validation and type safety.
 */
import { pgEnum } from "drizzle-orm/pg-core";

// =============================================================================
// Platform
// =============================================================================

/**
 * Supported content publishing platforms
 *
 * Phase 1: facebook, instagram
 * Future: gmb, linkedin, twitter
 */
export const contentPlatformEnum = pgEnum("content_platform", [
  "facebook",
  "instagram",
  "gmb",
  "linkedin",
  "twitter",
]);

// =============================================================================
// Post Status
// =============================================================================

/**
 * Content post lifecycle status
 */
export const contentPostStatusEnum = pgEnum("content_post_status", [
  "draft",
  "pending",
  "published",
  "failed",
]);

// =============================================================================
// Media Source
// =============================================================================

/**
 * How the media was sourced
 */
export const contentMediaSourceEnum = pgEnum("content_media_source", [
  "upload",
  "fal_generated",
  "url",
]);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for content platform enum values */
export type ContentPlatformDb = (typeof contentPlatformEnum.enumValues)[number];

/** Type for content post status enum values */
export type ContentPostStatusDb =
  (typeof contentPostStatusEnum.enumValues)[number];

/** Type for content media source enum values */
export type ContentMediaSourceDb =
  (typeof contentMediaSourceEnum.enumValues)[number];
