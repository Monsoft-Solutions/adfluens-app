/**
 * Content Post Table
 *
 * Stores social media content posts that can be published to multiple platforms.
 * Designed to be platform-agnostic with platform-specific results stored in JSONB.
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { contentPlatformEnum, contentPostStatusEnum } from "./content-enums";
import { metaPageTable } from "./meta-page.table";

// =============================================================================
// JSON Types for JSONB Columns
// =============================================================================

/**
 * Media item attached to a content post
 */
export type ContentPostMediaJson = {
  /** Original URL (user-provided or generated) */
  url: string;
  /** Stored URL in GCS after upload */
  storedUrl?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Alt text for accessibility */
  altText?: string;
  /** MIME type of the media */
  mimeType?: string;
  /** How the media was sourced */
  source: "upload" | "fal_generated" | "url";
};

/**
 * Result from publishing to a specific platform
 */
export type ContentPostPublishResultJson = {
  /** Platform-specific post ID */
  postId?: string;
  /** Permalink to the published post */
  permalink?: string;
  /** Error message if publishing failed */
  error?: string;
  /** When the post was published */
  publishedAt?: string;
};

// =============================================================================
// Table Definition
// =============================================================================

export const contentPostTable = pgTable(
  "content_post",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Organization that owns this post */
    organizationId: text("organization_id").notNull(),

    /** Target platforms for publishing (array of enum values) */
    platforms: contentPlatformEnum("platforms").array().notNull(),

    /**
     * Reference to Meta page (for Facebook/Instagram in Phase 1)
     * Nullable to support future platforms that don't use Meta pages
     */
    metaPageId: uuid("meta_page_id").references(() => metaPageTable.id, {
      onDelete: "set null",
    }),

    /** Post caption/text content */
    caption: text("caption").notNull(),

    /** Hashtags (without # symbol) */
    hashtags: text("hashtags").array(),

    /** Media attachments */
    media: jsonb("media").$type<ContentPostMediaJson[]>().notNull(),

    /** Current status of the post */
    status: contentPostStatusEnum("status").notNull().default("draft"),

    /** Results from publishing to each platform (keyed by platform name) */
    publishResults:
      jsonb("publish_results").$type<
        Record<string, ContentPostPublishResultJson>
      >(),

    /** Last error message (for quick access without parsing publishResults) */
    lastError: text("last_error"),

    /** User who created the post */
    createdByUserId: text("created_by_user_id").notNull(),

    /** When the post was created */
    createdAt: timestamp("created_at").defaultNow().notNull(),

    /** When the post was last updated */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("content_post_org_idx").on(table.organizationId),
    index("content_post_status_idx").on(table.status),
    index("content_post_meta_page_idx").on(table.metaPageId),
    index("content_post_created_idx").on(table.createdAt),
  ]
);

// =============================================================================
// Relations
// =============================================================================

export const contentPostTableRelations = relations(
  contentPostTable,
  ({ one }) => ({
    /** Reference to the Meta page used for publishing */
    metaPage: one(metaPageTable, {
      fields: [contentPostTable.metaPageId],
      references: [metaPageTable.id],
    }),
  })
);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for inserting a new content post */
export type ContentPostInsert = typeof contentPostTable.$inferInsert;

/** Type for selecting a content post */
export type ContentPostRow = typeof contentPostTable.$inferSelect;
