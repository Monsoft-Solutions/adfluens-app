import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import type { GMBLocationData } from "@repo/types/gmb/gmb-location-data.type";

/**
 * GMB (Google Business Profile) Connection table
 *
 * Stores the connection between an organization and their Google Business Profile location.
 * Each organization can have one GMB location connected.
 * OAuth tokens are stored for making API calls on behalf of the user.
 */
export const gmbConnectionTable = pgTable(
  "gmb_connection",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the organization (unique - one GMB per organization) */
    organizationId: text("organization_id").notNull().unique(),

    /** User who connected their Google account for GMB */
    connectedByUserId: text("connected_by_user_id").notNull(),

    /** Google Business Profile account ID */
    gmbAccountId: text("gmb_account_id").notNull(),

    /** Google Business Profile location ID */
    gmbLocationId: text("gmb_location_id").notNull(),

    /** Display name of the location */
    gmbLocationName: text("gmb_location_name"),

    /** OAuth access token for GMB API calls */
    accessToken: text("access_token").notNull(),

    /** OAuth refresh token for obtaining new access tokens */
    refreshToken: text("refresh_token"),

    /** When the access token expires */
    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    /** OAuth scope granted */
    scope: text("scope"),

    /** Cached location data from GMB API */
    locationData: jsonb("location_data").$type<GMBLocationData>(),

    /** Connection status: active, disconnected, or error */
    status: text("status").notNull().default("active"),

    /** When the location data was last synced from GMB API */
    lastSyncedAt: timestamp("last_synced_at"),

    /** Last error message if status is error */
    lastError: text("last_error"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gmb_connection_org_id_idx").on(table.organizationId),
    index("gmb_connection_status_idx").on(table.status),
  ]
);

/**
 * GMB connection relations
 * Note: The organization table is defined in the auth package
 * This relation is for documentation purposes - actual FK is handled by application logic
 */
export const gmbConnectionTableRelations = relations(
  gmbConnectionTable,
  () => ({
    // Organization relation would be defined here if we had access to the auth schema
    // For now, organizationId is enforced at the application level
  })
);

/** Type for inserting a new GMB connection */
export type GmbConnectionInsert = typeof gmbConnectionTable.$inferInsert;

/** Type for selecting a GMB connection */
export type GmbConnectionRow = typeof gmbConnectionTable.$inferSelect;
