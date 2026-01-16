import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { metaPageTable } from "./meta-page.table";

/**
 * Available time slot configuration
 */
export type MetaAppointmentSlot = {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
};

/**
 * Service offered for appointments
 */
export type MetaAppointmentService = {
  id: string;
  name: string;
  duration: number; // minutes
  description?: string;
  price?: number;
  currency?: string;
};

/**
 * Meta Appointment Config table
 *
 * Stores appointment scheduling configuration for each page.
 * Includes available time slots, services, and notification settings.
 */
export const metaAppointmentConfigTable = pgTable(
  "meta_appointment_config",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page (unique - one config per page) */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .unique()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Timezone for appointments */
    timezone: text("timezone").notNull().default("America/New_York"),

    /** Available time slots per day */
    availableSlots: jsonb("available_slots").$type<MetaAppointmentSlot[]>(),

    /** Buffer time between appointments in minutes */
    bufferMinutes: integer("buffer_minutes").default(15),

    /** How far in advance appointments can be booked (days) */
    maxAdvanceDays: integer("max_advance_days").default(30),

    /** Minimum advance notice required (hours) */
    minAdvanceHours: integer("min_advance_hours").default(24),

    /** Services offered for booking */
    services: jsonb("services").$type<MetaAppointmentService[]>(),

    /** Custom confirmation message sent after booking */
    confirmationMessage: text("confirmation_message"),

    /** Whether to send reminder notifications */
    reminderEnabled: boolean("reminder_enabled").default(true).notNull(),

    /** Hours before appointment to send reminder */
    reminderHoursBefore: integer("reminder_hours_before").default(24),

    /** Whether appointment scheduling is active */
    isActive: boolean("is_active").default(true).notNull(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("meta_appt_config_org_idx").on(table.organizationId)]
);

/**
 * Meta appointment config relations
 */
export const metaAppointmentConfigTableRelations = relations(
  metaAppointmentConfigTable,
  ({ one }) => ({
    metaPage: one(metaPageTable, {
      fields: [metaAppointmentConfigTable.metaPageId],
      references: [metaPageTable.id],
    }),
  })
);

/** Type for inserting a new Meta appointment config */
export type MetaAppointmentConfigInsert =
  typeof metaAppointmentConfigTable.$inferInsert;

/** Type for selecting a Meta appointment config */
export type MetaAppointmentConfigRow =
  typeof metaAppointmentConfigTable.$inferSelect;
