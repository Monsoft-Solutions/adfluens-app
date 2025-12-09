import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  boolean,
  jsonb,
  real,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { InstagramPostMedia } from "@repo/types/social-media/instagram-post.type";
import { socialMediaAccountTable } from "./social-media-account.table";

/**
 * Social media post table
 *
 * Stores individual posts from social media accounts.
 * Currently supports Instagram posts (images, videos, reels, carousels).
 */
export const socialMediaPostTable = pgTable(
  "social_media_post",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the social media account */
    socialMediaAccountId: text("social_media_account_id")
      .notNull()
      .references(() => socialMediaAccountTable.id, { onDelete: "cascade" }),

    /** Platform's unique post ID */
    platformPostId: text("platform_post_id").notNull(),

    /** Post shortcode (used in URLs, e.g., "DRx75f1DlHy") */
    shortcode: text("shortcode").notNull(),

    /** Media type: image, video, or carousel */
    mediaType: text("media_type").notNull(),

    /** Product type: clips (reel) or feed (regular post) */
    productType: text("product_type"),

    /** Post caption/description text */
    caption: text("caption"),

    /** Full URL to the post */
    postUrl: text("post_url"),

    /** Thumbnail/display image URL */
    thumbnailUrl: text("thumbnail_url"),

    /** Original Thumbnail URL (from source) */
    originalThumbnailUrl: text("original_thumbnail_url"),

    /** Number of video plays (for videos/reels) */
    playCount: integer("play_count"),

    /** Number of likes */
    likeCount: integer("like_count"),

    /** Number of comments */
    commentCount: integer("comment_count"),

    /** Video duration in seconds (for videos/reels) */
    videoDuration: real("video_duration"),

    /** Whether the video has audio */
    hasAudio: boolean("has_audio"),

    /** Timestamp when post was created on the platform */
    takenAt: timestamp("taken_at"),

    /** Array of media URLs (images/videos) */
    mediaUrls: jsonb("media_urls").$type<InstagramPostMedia[]>(),

    /** Timestamp of when this post was last scraped */
    scrapedAt: timestamp("scraped_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("social_media_post_account_idx").on(table.socialMediaAccountId),
    index("social_media_post_shortcode_idx").on(table.shortcode),
    index("social_media_post_taken_at_idx").on(table.takenAt),
    // Unique constraint: one post per platform post ID per account
    uniqueIndex("social_media_post_account_platform_id_uniq").on(
      table.socialMediaAccountId,
      table.platformPostId
    ),
  ]
);

/**
 * Social media post relations
 */
export const socialMediaPostTableRelations = relations(
  socialMediaPostTable,
  ({ one }) => ({
    socialMediaAccount: one(socialMediaAccountTable, {
      fields: [socialMediaPostTable.socialMediaAccountId],
      references: [socialMediaAccountTable.id],
    }),
  })
);

/** Type for inserting a new social media post */
export type SocialMediaPostInsert = typeof socialMediaPostTable.$inferInsert;

/** Type for selecting a social media post */
export type SocialMediaPostRow = typeof socialMediaPostTable.$inferSelect;
