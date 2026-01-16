import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { googleConnectionTable } from "./google-connection.table";
import { connectionStatusEnum } from "./meta-enums";
import type { GMBLocationData } from "@repo/types/gmb/gmb-location-data.type";

/**
 * GMB Location table
 *
 * Stores individual Google Business Profile locations linked to a Google connection.
 * Each connection can have multiple locations, but only one can be active at a time.
 * Tokens are NOT stored here - they are shared via the parent Google connection.
 */
export const gmbLocationTable = pgTable(
  "gmb_location",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the parent Google connection */
    googleConnectionId: uuid("google_connection_id")
      .notNull()
      .references(() => googleConnectionTable.id, { onDelete: "cascade" }),

    /** Reference to the organization */
    organizationId: text("organization_id").notNull(),

    /** Google Business Profile account ID */
    gmbAccountId: text("gmb_account_id").notNull(),

    /** Google Business Profile location ID */
    gmbLocationId: text("gmb_location_id").notNull(),

    /** Display name of the location */
    locationName: text("location_name"),

    /** Whether this is the active/selected location for the organization */
    isActive: boolean("is_active").default(false).notNull(),

    /** Cached location data from GMB API */
    locationData: jsonb("location_data").$type<GMBLocationData>(),

    /** Location status */
    status: connectionStatusEnum("status").notNull().default("active"),

    /** Last error message if status is error */
    lastError: text("last_error"),

    /** When the location data was last synced */
    lastSyncedAt: timestamp("last_synced_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gmb_location_connection_idx").on(table.googleConnectionId),
    index("gmb_location_org_idx").on(table.organizationId),
    index("gmb_location_id_idx").on(table.gmbLocationId),
    index("gmb_location_active_idx").on(table.organizationId, table.isActive),
  ]
);

/**
 * GMB location relations
 */
export const gmbLocationTableRelations = relations(
  gmbLocationTable,
  ({ one }) => ({
    googleConnection: one(googleConnectionTable, {
      fields: [gmbLocationTable.googleConnectionId],
      references: [googleConnectionTable.id],
    }),
  })
);

/** Type for inserting a new GMB location */
export type GmbLocationInsert = typeof gmbLocationTable.$inferInsert;

/** Type for selecting a GMB location */
export type GmbLocationRow = typeof gmbLocationTable.$inferSelect;
