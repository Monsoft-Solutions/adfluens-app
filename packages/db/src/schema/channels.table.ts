import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * YouTube channels table
 * Stores cached channel information from the YouTube API
 */
export const channels = pgTable("channels", {
  /** YouTube channel ID (e.g., UC...) */
  id: varchar("id", { length: 255 }).primaryKey(),

  /** Channel display name */
  title: varchar("title", { length: 255 }).notNull(),

  /** Channel description */
  description: text("description"),

  /** URL to channel thumbnail image */
  thumbnail_url: text("thumbnail_url"),

  /** Number of subscribers */
  subscriber_count: integer("subscriber_count"),

  /** Total number of videos */
  video_count: integer("video_count"),

  /** Total view count across all videos */
  view_count: integer("view_count"),

  /** Timestamp when record was created */
  created_at: timestamp("created_at").defaultNow().notNull(),

  /** Timestamp when record was last updated */
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
