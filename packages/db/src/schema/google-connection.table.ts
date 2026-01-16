import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { connectionStatusEnum } from "./meta-enums";

/**
 * Google Services enum - services that can be enabled for a Google connection
 */
export const GoogleService = {
  GA: "ga",
  GMB: "gmb",
  GSC: "gsc",
} as const;

export type GoogleServiceType =
  (typeof GoogleService)[keyof typeof GoogleService];

/**
 * Google Connection table
 *
 * Unified OAuth connection for all Google services (GA, GMB, GSC).
 * Uses incremental authorization - base scopes are granted initially,
 * additional scopes are added when user enables more services.
 *
 * One Google connection per organization. Services are toggled via enabledServices array.
 */
export const googleConnectionTable = pgTable(
  "google_connection",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the organization (unique - one Google connection per organization) */
    organizationId: text("organization_id").notNull().unique(),

    /** User who connected their Google account */
    connectedByUserId: text("connected_by_user_id").notNull(),

    /** Google account ID (sub claim from userinfo) */
    googleAccountId: text("google_account_id").notNull(),

    /** Google account email */
    googleEmail: text("google_email"),

    /** Google account display name */
    googleName: text("google_name"),

    /** Google account profile picture URL */
    googlePicture: text("google_picture"),

    /** Access token for Google API calls */
    accessToken: text("access_token").notNull(),

    /** Refresh token for obtaining new access tokens */
    refreshToken: text("refresh_token"),

    /** When the access token expires */
    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    /**
     * All OAuth scopes currently granted (space-separated string)
     * Example: "openid email profile https://www.googleapis.com/auth/analytics.readonly"
     */
    grantedScopes: text("granted_scopes"),

    /**
     * Services enabled for this connection
     * Example: ['ga', 'gmb', 'gsc']
     */
    enabledServices: text("enabled_services")
      .array()
      .$type<GoogleServiceType[]>()
      .default([])
      .notNull(),

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
    index("google_connection_org_id_idx").on(table.organizationId),
    index("google_connection_status_idx").on(table.status),
  ]
);

/**
 * Google connection relations
 */
export const googleConnectionTableRelations = relations(
  googleConnectionTable,
  () => ({
    // Relations defined in child tables to avoid circular imports
    // - gaPropertyTable references this via googleConnectionId
    // - gmbLocationTable references this via googleConnectionId
  })
);

/** Type for inserting a new Google connection */
export type GoogleConnectionInsert = typeof googleConnectionTable.$inferInsert;

/** Type for selecting a Google connection */
export type GoogleConnectionRow = typeof googleConnectionTable.$inferSelect;
