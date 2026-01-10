import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { metaPageTable } from "./meta-page.table";
import { metaConversationTable } from "./meta-conversation.table";

/**
 * Meta Appointment table
 *
 * Stores booked appointments with customer and service details.
 * Linked to conversations and pages for tracking.
 */
export const metaAppointmentTable = pgTable(
  "meta_appointment",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Reference to the conversation (optional - appointments can be manual) */
    metaConversationId: uuid("meta_conversation_id").references(
      () => metaConversationTable.id,
      { onDelete: "set null" }
    ),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Service ID from appointment config */
    serviceId: text("service_id"),

    /** Service name (denormalized for display) */
    serviceName: text("service_name").notNull(),

    /** Scheduled date and time */
    scheduledAt: timestamp("scheduled_at").notNull(),

    /** Duration in minutes */
    duration: integer("duration").notNull(),

    /** Customer name */
    customerName: text("customer_name"),

    /** Customer email */
    customerEmail: text("customer_email"),

    /** Customer phone */
    customerPhone: text("customer_phone"),

    /** Customer notes/special requests */
    customerNotes: text("customer_notes"),

    /** Appointment status */
    status: text("status").notNull().default("scheduled"),

    /** Whether reminder was sent */
    reminderSent: boolean("reminder_sent").default(false).notNull(),

    /** When reminder was sent */
    reminderSentAt: timestamp("reminder_sent_at"),

    /** When appointment was confirmed */
    confirmedAt: timestamp("confirmed_at"),

    /** When appointment was cancelled */
    cancelledAt: timestamp("cancelled_at"),

    /** Cancellation reason */
    cancellationReason: text("cancellation_reason"),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_appt_page_idx").on(table.metaPageId),
    index("meta_appt_conv_idx").on(table.metaConversationId),
    index("meta_appt_org_idx").on(table.organizationId),
    index("meta_appt_scheduled_idx").on(table.scheduledAt),
    index("meta_appt_status_idx").on(table.status),
    index("meta_appt_customer_email_idx").on(table.customerEmail),
  ]
);

/**
 * Meta appointment relations
 */
export const metaAppointmentTableRelations = relations(
  metaAppointmentTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaAppointmentTable.metaPageId],
      references: [metaPageTable.id],
    }),
    metaConversation: one(metaConversationTable, {
      fields: [metaAppointmentTable.metaConversationId],
      references: [metaConversationTable.id],
    }),
  })
);

/** Type for inserting a new Meta appointment */
export type MetaAppointmentInsert = typeof metaAppointmentTable.$inferInsert;

/** Type for selecting a Meta appointment */
export type MetaAppointmentRow = typeof metaAppointmentTable.$inferSelect;
