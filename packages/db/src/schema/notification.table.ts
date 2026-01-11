import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Notification payload for Meta lead events
 */
export type MetaLeadNotificationPayload = {
  type: "meta_lead";
  leadId: string;
  pageId: string;
  pageName: string;
  leadName?: string;
  leadEmail?: string;
  formName?: string;
};

/**
 * Notification payload for Meta message events
 */
export type MetaMessageNotificationPayload = {
  type: "meta_message";
  conversationId: string;
  pageId: string;
  pageName: string;
  platform: "messenger" | "instagram";
  senderName?: string;
  messagePreview?: string;
};

/**
 * Notification payload for handoff requests
 */
export type MetaHandoffNotificationPayload = {
  type: "meta_handoff";
  conversationId: string;
  pageId: string;
  pageName: string;
  platform: "messenger" | "instagram";
  reason: string;
};

/**
 * Notification payload for system events
 */
export type SystemNotificationPayload = {
  type: "system";
  title: string;
  message: string;
};

/**
 * Union of all notification payload types
 */
export type NotificationPayload =
  | MetaLeadNotificationPayload
  | MetaMessageNotificationPayload
  | MetaHandoffNotificationPayload
  | SystemNotificationPayload;

/**
 * Notification table
 *
 * Stores in-app notifications for users.
 * Supports different notification types with type-specific payloads.
 * Can be targeted to specific users or entire organizations.
 */
export const notificationTable = pgTable(
  "notification",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Organization this notification belongs to */
    organizationId: text("organization_id").notNull(),

    /** Specific user ID (null = all org members) */
    userId: text("user_id"),

    /** Notification type for filtering */
    type: text("type").notNull(),

    /** Notification title */
    title: text("title").notNull(),

    /** Notification body/message */
    body: text("body").notNull(),

    /** Type-specific payload data */
    payload: jsonb("payload").$type<NotificationPayload>(),

    /** Link to navigate to when clicked */
    actionUrl: text("action_url"),

    /** Whether the notification has been read */
    isRead: boolean("is_read").default(false).notNull(),

    /** Whether the notification has been dismissed */
    isDismissed: boolean("is_dismissed").default(false).notNull(),

    /** When the notification expires (null = never) */
    expiresAt: timestamp("expires_at"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notification_org_idx").on(table.organizationId),
    index("notification_user_idx").on(table.userId),
    index("notification_type_idx").on(table.type),
    index("notification_read_idx").on(table.isRead),
    index("notification_created_idx").on(table.createdAt),
  ]
);

/** Type for inserting a new notification */
export type NotificationInsert = typeof notificationTable.$inferInsert;

/** Type for selecting a notification */
export type NotificationRow = typeof notificationTable.$inferSelect;
