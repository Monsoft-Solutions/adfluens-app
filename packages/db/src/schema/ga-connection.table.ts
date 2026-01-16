import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { connectionStatusEnum } from "./meta-enums";

/**
 * Google Analytics Connection table
 *
 * Stores the OAuth connection between an organization and their Google Analytics account.
 * Each organization can have one GA connection (the user who authorized).
 * From this connection, multiple GA4 properties can be linked.
 */
export const gaConnectionTable = pgTable(
  "ga_connection",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the organization (unique - one GA connection per organization) */
    organizationId: text("organization_id").notNull().unique(),

    /** User who connected their Google Analytics account */
    connectedByUserId: text("connected_by_user_id").notNull(),

    /** Google account ID */
    googleAccountId: text("google_account_id").notNull(),

    /** Google account email */
    googleEmail: text("google_email"),

    /** Access token for Google Analytics API calls */
    accessToken: text("access_token").notNull(),

    /** Refresh token for obtaining new access tokens */
    refreshToken: text("refresh_token"),

    /** When the access token expires */
    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    /** OAuth scopes granted */
    scope: text("scope"),

    /** Connection status: active, pending, disconnected, or error */
    status: connectionStatusEnum("status").notNull().default("active"),

    /** Last error message if status is error */
    lastError: text("last_error"),

    /** When the connection was last validated */
    lastValidatedAt: timestamp("last_validated_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ga_connection_org_id_idx").on(table.organizationId),
    index("ga_connection_status_idx").on(table.status),
  ]
);

/**
 * GA connection relations
 */
export const gaConnectionTableRelations = relations(gaConnectionTable, () => ({
  // Relations defined in ga-property.table.ts to avoid circular imports
}));

/** Type for inserting a new GA connection */
export type GaConnectionInsert = typeof gaConnectionTable.$inferInsert;

/** Type for selecting a GA connection */
export type GaConnectionRow = typeof gaConnectionTable.$inferSelect;
