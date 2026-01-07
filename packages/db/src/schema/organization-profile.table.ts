import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import type { ScrapedBusinessInfo } from "@repo/types/organization/organization-profile.type";

/**
 * Organization profile table
 * Stores website, social media links, and scraped business information
 */
export const organizationProfileTable = pgTable(
  "organization_profile",
  {
    /** Unique identifier */
    id: text("id").primaryKey(),

    /** Reference to the organization (unique - one profile per organization) */
    organizationId: text("organization_id").notNull().unique(),

    /** Business website URL */
    websiteUrl: text("website_url"),

    /** Social media profile URLs */
    instagramUrl: text("instagram_url"),
    facebookUrl: text("facebook_url"),
    tiktokUrl: text("tiktok_url"),
    twitterUrl: text("twitter_url"),
    linkedinUrl: text("linkedin_url"),

    /** Scraped business information from the website */
    scrapedData: jsonb("scraped_data").$type<ScrapedBusinessInfo>(),

    /** Timestamp of when the website was last scraped */
    scrapedAt: timestamp("scraped_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organization_profile_org_id_idx").on(table.organizationId),
    index("organization_profile_scraped_at_idx").on(table.scrapedAt),
  ]
);

/**
 * Organization profile relations
 * Note: The organization table is defined in the auth package
 * This relation is for documentation purposes - actual FK is handled by application logic
 */
export const organizationProfileTableRelations = relations(
  organizationProfileTable,
  () => ({
    // Organization relation would be defined here if we had access to the auth schema
    // For now, organizationId is enforced at the application level
  })
);

/** Type for inserting a new organization profile */
export type OrganizationProfileInsert =
  typeof organizationProfileTable.$inferInsert;

/** Type for selecting an organization profile */
export type OrganizationProfileRow =
  typeof organizationProfileTable.$inferSelect;
