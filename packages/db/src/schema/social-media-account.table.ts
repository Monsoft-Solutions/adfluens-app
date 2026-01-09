import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { PlatformData } from "@repo/types/social-media/platform-data.type";
import { organizationProfileTable } from "./organization-profile.table";

/**
 * Social media account table
 *
 * Stores social media profile data for organizations across multiple platforms.
 * Platform-specific data is stored in a typed JSONB column.
 */
export const socialMediaAccountTable = pgTable(
  "social_media_account",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the organization profile */
    organizationProfileId: uuid("organization_profile_id")
      .notNull()
      .references(() => organizationProfileTable.id, { onDelete: "cascade" }),

    /** Social media platform (instagram, facebook, tiktok, youtube, etc.) */
    platform: text("platform").notNull(),

    /** Platform's unique user/account ID */
    platformUserId: text("platform_user_id").notNull(),

    /** Username/handle on the platform */
    username: text("username").notNull(),

    /** Display name or full name */
    displayName: text("display_name"),

    /** Account biography/description */
    bio: text("bio"),

    /** Profile picture URL (standard resolution) */
    profilePicUrl: text("profile_pic_url"),

    /** Profile picture URL (high resolution) */
    profilePicUrlHd: text("profile_pic_url_hd"),

    /** External/website URL */
    externalUrl: text("external_url"),

    /** Number of followers */
    followerCount: integer("follower_count"),

    /** Number of accounts following */
    followingCount: integer("following_count"),

    /** Whether account is verified */
    isVerified: boolean("is_verified").default(false).notNull(),

    /** Whether account is a business/professional account */
    isBusinessAccount: boolean("is_business_account").default(false).notNull(),

    /** Platform-specific metadata (typed JSONB) */
    platformData: jsonb("platform_data").$type<PlatformData>(),

    /** Timestamp of when this account was last scraped */
    scrapedAt: timestamp("scraped_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("social_media_account_org_profile_idx").on(
      table.organizationProfileId
    ),
    index("social_media_account_platform_idx").on(table.platform),
    index("social_media_account_username_idx").on(table.username),
    // Unique constraint: one account per platform per organization
    uniqueIndex("social_media_account_org_platform_uniq").on(
      table.organizationProfileId,
      table.platform
    ),
  ]
);

/**
 * Social media account relations
 */
export const socialMediaAccountTableRelations = relations(
  socialMediaAccountTable,
  ({ one }) => ({
    organizationProfile: one(organizationProfileTable, {
      fields: [socialMediaAccountTable.organizationProfileId],
      references: [organizationProfileTable.id],
    }),
  })
);

/** Type for inserting a new social media account */
export type SocialMediaAccountInsert =
  typeof socialMediaAccountTable.$inferInsert;

/** Type for selecting a social media account */
export type SocialMediaAccountRow = typeof socialMediaAccountTable.$inferSelect;
