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
import { metaPageTable } from "./meta-page.table";
import { leadStatusEnum } from "./meta-enums";

/**
 * Lead field data from Meta Lead Ads form submission
 */
export type MetaLeadFieldData = {
  name: string;
  values: string[];
};

/**
 * Meta Lead table
 *
 * Stores leads captured from Meta Lead Generation Ads.
 * Leads are received via webhooks and stored with their form data.
 */
export const metaLeadTable = pgTable(
  "meta_lead",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Reference to the Meta page that received the lead */
    metaPageId: uuid("meta_page_id")
      .notNull()
      .references(() => metaPageTable.id, { onDelete: "cascade" }),

    /** Organization ID for quick lookups (denormalized) */
    organizationId: text("organization_id").notNull(),

    /** Meta's lead ID (from leadgen webhook) */
    leadId: text("lead_id").notNull().unique(),

    /** Form ID the lead came from */
    formId: text("form_id").notNull(),

    /** Form name for display */
    formName: text("form_name"),

    /** Ad ID that generated the lead */
    adId: text("ad_id"),

    /** Ad name for display */
    adName: text("ad_name"),

    /** Campaign ID */
    campaignId: text("campaign_id"),

    /** Campaign name */
    campaignName: text("campaign_name"),

    /** When the lead was created on Meta */
    leadCreatedAt: timestamp("lead_created_at").notNull(),

    /** Extracted full name from form data */
    fullName: text("full_name"),

    /** Extracted email from form data */
    email: text("email"),

    /** Extracted phone number from form data */
    phone: text("phone"),

    /** Raw field data from the lead form */
    fieldData: jsonb("field_data").$type<MetaLeadFieldData[]>(),

    /** Processing status: new, contacted, qualified, converted, lost */
    status: leadStatusEnum("status").notNull().default("new"),

    /** Notes added by user */
    notes: text("notes"),

    /** Whether notifications have been sent for this lead */
    notificationsSent: boolean("notifications_sent").default(false).notNull(),

    /** Record timestamps */
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meta_lead_page_idx").on(table.metaPageId),
    index("meta_lead_org_idx").on(table.organizationId),
    index("meta_lead_status_idx").on(table.status),
    index("meta_lead_created_idx").on(table.leadCreatedAt),
    index("meta_lead_email_idx").on(table.email),
  ]
);

/**
 * Meta lead relations
 */
export const metaLeadTableRelations = relations(metaLeadTable, ({ one }) => ({
  metaPage: one(metaPageTable, {
    fields: [metaLeadTable.metaPageId],
    references: [metaPageTable.id],
  }),
}));

/** Type for inserting a new Meta lead */
export type MetaLeadInsert = typeof metaLeadTable.$inferInsert;

/** Type for selecting a Meta lead */
export type MetaLeadRow = typeof metaLeadTable.$inferSelect;
