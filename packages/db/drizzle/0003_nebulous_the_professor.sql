CREATE TABLE "meta_bot_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"flow_type" text NOT NULL,
	"nodes" jsonb NOT NULL,
	"entry_node_id" text NOT NULL,
	"global_triggers" jsonb,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_conversation_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_conversation_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"context" jsonb NOT NULL,
	"bot_mode" text DEFAULT 'ai' NOT NULL,
	"lead_score" integer DEFAULT 0,
	"qualification_status" text,
	"last_bot_response_at" timestamp,
	"last_user_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_conversation_state_meta_conversation_id_unique" UNIQUE("meta_conversation_id")
);
--> statement-breakpoint
CREATE TABLE "meta_team_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_conversation_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"assigned_to_user_id" text,
	"assigned_at" timestamp,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"handoff_reason" text,
	"handoff_triggered_by" text,
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"internal_notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_appointment_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"available_slots" jsonb,
	"buffer_minutes" integer DEFAULT 15,
	"max_advance_days" integer DEFAULT 30,
	"min_advance_hours" integer DEFAULT 24,
	"services" jsonb,
	"confirmation_message" text,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"reminder_hours_before" integer DEFAULT 24,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_appointment_config_meta_page_id_unique" UNIQUE("meta_page_id")
);
--> statement-breakpoint
CREATE TABLE "meta_appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"meta_conversation_id" uuid,
	"organization_id" text NOT NULL,
	"service_id" text,
	"service_name" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"customer_notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "sales_assistant_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "customer_support_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "appointment_scheduling_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "flows_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "fallback_to_ai" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "sales_config" jsonb;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "support_config" jsonb;--> statement-breakpoint
ALTER TABLE "meta_bot_flow" ADD CONSTRAINT "meta_bot_flow_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_conversation_state" ADD CONSTRAINT "meta_conversation_state_meta_conversation_id_meta_conversation_id_fk" FOREIGN KEY ("meta_conversation_id") REFERENCES "public"."meta_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_team_inbox" ADD CONSTRAINT "meta_team_inbox_meta_conversation_id_meta_conversation_id_fk" FOREIGN KEY ("meta_conversation_id") REFERENCES "public"."meta_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_appointment_config" ADD CONSTRAINT "meta_appointment_config_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_appointment" ADD CONSTRAINT "meta_appointment_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_appointment" ADD CONSTRAINT "meta_appointment_meta_conversation_id_meta_conversation_id_fk" FOREIGN KEY ("meta_conversation_id") REFERENCES "public"."meta_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_bot_flow_page_idx" ON "meta_bot_flow" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_bot_flow_org_idx" ON "meta_bot_flow" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_bot_flow_type_idx" ON "meta_bot_flow" USING btree ("flow_type");--> statement-breakpoint
CREATE INDEX "meta_bot_flow_priority_idx" ON "meta_bot_flow" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "meta_bot_flow_active_idx" ON "meta_bot_flow" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "meta_conv_state_conv_idx" ON "meta_conversation_state" USING btree ("meta_conversation_id");--> statement-breakpoint
CREATE INDEX "meta_conv_state_org_idx" ON "meta_conversation_state" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_conv_state_mode_idx" ON "meta_conversation_state" USING btree ("bot_mode");--> statement-breakpoint
CREATE INDEX "meta_conv_state_qual_idx" ON "meta_conversation_state" USING btree ("qualification_status");--> statement-breakpoint
CREATE INDEX "meta_inbox_conv_idx" ON "meta_team_inbox" USING btree ("meta_conversation_id");--> statement-breakpoint
CREATE INDEX "meta_inbox_org_idx" ON "meta_team_inbox" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_inbox_assigned_idx" ON "meta_team_inbox" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "meta_inbox_status_idx" ON "meta_team_inbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_inbox_priority_idx" ON "meta_team_inbox" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "meta_inbox_created_idx" ON "meta_team_inbox" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_appt_config_page_idx" ON "meta_appointment_config" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_appt_config_org_idx" ON "meta_appointment_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_appt_page_idx" ON "meta_appointment" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_appt_conv_idx" ON "meta_appointment" USING btree ("meta_conversation_id");--> statement-breakpoint
CREATE INDEX "meta_appt_org_idx" ON "meta_appointment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_appt_scheduled_idx" ON "meta_appointment" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "meta_appt_status_idx" ON "meta_appointment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_appt_customer_email_idx" ON "meta_appointment" USING btree ("customer_email");