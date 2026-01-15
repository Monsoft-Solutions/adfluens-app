/**
 * Platform Connection Table
 *
 * Unified abstraction for all platform accounts (Facebook, Instagram, GMB, LinkedIn, Twitter).
 * Each row represents a single publishable account on a specific platform.
 * Links back to the source connection/page for credential resolution.
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contentPlatformEnum } from "./content-enums";

// =============================================================================
// Enums
// =============================================================================

/**
 * Platform connection status
 */
export const platformConnectionStatusEnum = pgEnum(
  "platform_connection_status",
  ["active", "disconnected", "error"]
);

/**
 * Source type for credential resolution
 */
export const platformSourceTypeEnum = pgEnum("platform_source_type", [
  "meta_page",
  "gmb_connection",
  "linkedin_connection",
  "twitter_connection",
]);

// =============================================================================
// Table Definition
// =============================================================================

export const platformConnectionTable = pgTable(
  "platform_connection",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Organization that owns this connection */
    organizationId: text("organization_id").notNull(),

    /** Target platform */
    platform: contentPlatformEnum("platform").notNull(),

    /** Platform-specific account identifier (pageId, accountId, etc.) */
    platformAccountId: text("platform_account_id").notNull(),

    /** Display name of the account */
    accountName: text("account_name").notNull(),

    /** Username/handle (if applicable) */
    accountUsername: text("account_username"),

    /** Profile image URL */
    accountImageUrl: text("account_image_url"),

    /**
     * Source type for credential resolution.
     * Determines which table to query for access tokens.
     */
    sourceType: platformSourceTypeEnum("source_type").notNull(),

    /**
     * Reference to source connection record.
     * - meta_page: metaPageTable.id
     * - gmb_connection: gmbConnectionTable.id
     * - linkedin_connection: linkedinConnectionTable.id (future)
     * - twitter_connection: twitterConnectionTable.id (future)
     */
    sourceId: uuid("source_id").notNull(),

    /** Connection status */
    status: platformConnectionStatusEnum("status").notNull().default("active"),

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
    index("platform_connection_org_idx").on(table.organizationId),
    index("platform_connection_platform_idx").on(table.platform),
    index("platform_connection_source_idx").on(
      table.sourceType,
      table.sourceId
    ),
    index("platform_connection_status_idx").on(table.status),
    // Ensure unique account per org+platform
    uniqueIndex("platform_connection_org_platform_account_uniq").on(
      table.organizationId,
      table.platform,
      table.platformAccountId
    ),
  ]
);

// =============================================================================
// Relations
// =============================================================================

export const platformConnectionTableRelations = relations(
  platformConnectionTable,
  () => ({
    // Relations to source tables would be added here if needed
    // Currently we resolve credentials dynamically based on sourceType
  })
);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for inserting a new platform connection */
export type PlatformConnectionInsert =
  typeof platformConnectionTable.$inferInsert;

/** Type for selecting a platform connection */
export type PlatformConnectionRow = typeof platformConnectionTable.$inferSelect;

/** Type for platform connection status enum values */
export type PlatformConnectionStatusDb =
  (typeof platformConnectionStatusEnum.enumValues)[number];

/** Type for platform source type enum values */
export type PlatformSourceTypeDb =
  (typeof platformSourceTypeEnum.enumValues)[number];
