import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organizationProfile } from "./organization-profile.table";

/**
 * Scraped page table
 * Stores raw webpage content from scraping operations
 */
export const scrapedPage = pgTable(
  "scraped_page",
  {
    /** Unique identifier */
    id: text("id").primaryKey(),

    /** Reference to the organization profile */
    organizationProfileId: text("organization_profile_id")
      .notNull()
      .references(() => organizationProfile.id, { onDelete: "cascade" }),

    /** The specific URL that was scraped */
    pageUrl: text("page_url").notNull(),

    /** Raw webpage content (markdown) */
    content: text("content").notNull(),

    /** Timestamp of when this page was scraped */
    scrapedAt: timestamp("scraped_at").notNull(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("scraped_page_org_profile_id_idx").on(table.organizationProfileId),
    index("scraped_page_url_idx").on(table.pageUrl),
  ]
);

/**
 * Scraped page relations
 */
export const scrapedPageRelations = relations(scrapedPage, ({ one }) => ({
  organizationProfile: one(organizationProfile, {
    fields: [scrapedPage.organizationProfileId],
    references: [organizationProfile.id],
  }),
}));

/** Type for inserting a new scraped page */
export type NewScrapedPage = typeof scrapedPage.$inferInsert;

/** Type for selecting a scraped page */
export type ScrapedPage = typeof scrapedPage.$inferSelect;
