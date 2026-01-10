import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, uuid } from "drizzle-orm/pg-core";

/**
 * Meta Connection table
 *
 * Stores the OAuth connection between an organization and their Meta account.
 * Each organization can have one Meta connection (the user who authorized).
 * From this connection, multiple pages can be linked.
 */
export const metaConnectionTable = pgTable(
  "meta_connection",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the organization (unique - one Meta connection per organization) */
    organizationId: text("organization_id").notNull().unique(),

    /** User who connected their Meta account */
    connectedByUserId: text("connected_by_user_id").notNull(),

    /** Meta user ID */
    metaUserId: text("meta_user_id").notNull(),

    /** Meta user display name */
    metaUserName: text("meta_user_name"),

    /** Long-lived access token for Meta API calls (~60 days) */
    accessToken: text("access_token").notNull(),

    /** When the access token expires */
    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    /** OAuth scopes granted */
    scopes: text("scopes"),

    /** Connection status: active, pending, disconnected, or error */
    status: text("status").notNull().default("active"),

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
    index("meta_connection_org_id_idx").on(table.organizationId),
    index("meta_connection_status_idx").on(table.status),
  ]
);

/**
 * Meta connection relations
 */
export const metaConnectionTableRelations = relations(
  metaConnectionTable,
  () => ({
    // Relations defined in meta-page.table.ts to avoid circular imports
  })
);

/** Type for inserting a new Meta connection */
export type MetaConnectionInsert = typeof metaConnectionTable.$inferInsert;

/** Type for selecting a Meta connection */
export type MetaConnectionRow = typeof metaConnectionTable.$inferSelect;
