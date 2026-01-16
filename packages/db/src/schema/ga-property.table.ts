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

/**
 * GA4 Property metadata cached from the API
 */
export type GaPropertyData = {
  displayName?: string;
  industryCategory?: string;
  timeZone?: string;
  currencyCode?: string;
  createTime?: string;
  serviceLevel?: string;
  account?: string;
};

/**
 * Google Analytics Property table
 *
 * Stores individual GA4 properties linked to a Google connection.
 * Each connection can have multiple properties, but only one can be active at a time.
 */
export const gaPropertyTable = pgTable(
  "ga_property",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the parent Google connection */
    googleConnectionId: uuid("google_connection_id")
      .notNull()
      .references(() => googleConnectionTable.id, { onDelete: "cascade" }),

    /** Reference to the organization */
    organizationId: text("organization_id").notNull(),

    /** GA4 Property ID (e.g., "properties/123456789") */
    propertyId: text("property_id").notNull(),

    /** Human-readable property name */
    propertyName: text("property_name").notNull(),

    /** Whether this is the active/selected property for the organization */
    isActive: boolean("is_active").default(false).notNull(),

    /** Cached property metadata from GA Admin API */
    propertyData: jsonb("property_data").$type<GaPropertyData>(),

    /** Property status */
    status: connectionStatusEnum("status").notNull().default("active"),

    /** Last error message if status is error */
    lastError: text("last_error"),

    /** When the property data was last synced */
    lastSyncedAt: timestamp("last_synced_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ga_property_connection_idx").on(table.googleConnectionId),
    index("ga_property_org_idx").on(table.organizationId),
    index("ga_property_id_idx").on(table.propertyId),
    index("ga_property_active_idx").on(table.organizationId, table.isActive),
  ]
);

/**
 * GA property relations
 */
export const gaPropertyTableRelations = relations(
  gaPropertyTable,
  ({ one }) => ({
    googleConnection: one(googleConnectionTable, {
      fields: [gaPropertyTable.googleConnectionId],
      references: [googleConnectionTable.id],
    }),
  })
);

/** Type for inserting a new GA property */
export type GaPropertyInsert = typeof gaPropertyTable.$inferInsert;

/** Type for selecting a GA property */
export type GaPropertyRow = typeof gaPropertyTable.$inferSelect;
