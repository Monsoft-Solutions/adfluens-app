// Re-export database client
export { db } from "./client";

// Re-export schema tables
export {
  channelsTable,
  organizationProfileTable,
  organizationProfileTableRelations,
  scrapedPageTable,
  scrapedPageTableRelations,
  socialMediaAccountTable,
  socialMediaAccountTableRelations,
  socialMediaPostTable,
  socialMediaPostTableRelations,
  gmbConnectionTable,
  gmbConnectionTableRelations,
} from "./schema";

// Re-export drizzle-orm utilities for convenience
export { eq, and, or, desc, asc, sql, inArray, count } from "drizzle-orm";

// Inferred types from schema
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { channelsTable } from "./schema";

/** Type for selecting a channel from the database */
export type ChannelRow = InferSelectModel<typeof channelsTable>;

/** Type for inserting a new channel into the database */
export type ChannelInsert = InferInsertModel<typeof channelsTable>;

// Re-export organization profile types
export type {
  OrganizationProfileInsert,
  OrganizationProfileRow,
} from "./schema/organization-profile.table";

// Re-export scraped page types
export type {
  ScrapedPageInsert,
  ScrapedPageRow,
} from "./schema/scraped-page.table";

// Re-export social media account types
export type {
  SocialMediaAccountInsert,
  SocialMediaAccountRow,
} from "./schema/social-media-account.table";

// Re-export social media post types
export type {
  SocialMediaPostInsert,
  SocialMediaPostRow,
} from "./schema/social-media-post.table";

// Re-export GMB connection types
export type {
  GmbConnectionInsert,
  GmbConnectionRow,
} from "./schema/gmb-connection.table";
