CREATE TABLE "meta_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"meta_user_id" text NOT NULL,
	"meta_user_name" text,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp,
	"scopes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_connection_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "meta_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_connection_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"page_id" text NOT NULL,
	"page_name" text NOT NULL,
	"page_access_token" text NOT NULL,
	"messenger_enabled" boolean DEFAULT false NOT NULL,
	"instagram_account_id" text,
	"instagram_username" text,
	"instagram_dm_enabled" boolean DEFAULT false NOT NULL,
	"page_data" jsonb,
	"webhook_subscribed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"form_id" text NOT NULL,
	"form_name" text,
	"ad_id" text,
	"ad_name" text,
	"campaign_id" text,
	"campaign_name" text,
	"lead_created_at" timestamp NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"field_data" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"notifications_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_lead_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "meta_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"platform" text NOT NULL,
	"thread_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"participant_name" text,
	"participant_profile_pic" text,
	"last_message_preview" text,
	"last_message_at" timestamp,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"needs_attention" boolean DEFAULT false NOT NULL,
	"recent_messages" jsonb,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_conversation_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"ai_personality" jsonb,
	"ai_temperature" real DEFAULT 0.7 NOT NULL,
	"welcome_message" text,
	"away_message" text,
	"business_hours" jsonb,
	"response_rules" jsonb,
	"handoff_keywords" text[],
	"handoff_notification_email" text,
	"use_organization_context" boolean DEFAULT true NOT NULL,
	"use_website_context" boolean DEFAULT true NOT NULL,
	"additional_context" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_conversation_config_meta_page_id_unique" UNIQUE("meta_page_id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"payload" jsonb,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meta_page" ADD CONSTRAINT "meta_page_meta_connection_id_meta_connection_id_fk" FOREIGN KEY ("meta_connection_id") REFERENCES "public"."meta_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_lead" ADD CONSTRAINT "meta_lead_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_conversation" ADD CONSTRAINT "meta_conversation_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD CONSTRAINT "meta_conversation_config_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_connection_org_id_idx" ON "meta_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_connection_status_idx" ON "meta_connection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_page_connection_idx" ON "meta_page" USING btree ("meta_connection_id");--> statement-breakpoint
CREATE INDEX "meta_page_org_idx" ON "meta_page" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_page_page_id_idx" ON "meta_page" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "meta_page_instagram_id_idx" ON "meta_page" USING btree ("instagram_account_id");--> statement-breakpoint
CREATE INDEX "meta_page_status_idx" ON "meta_page" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_lead_page_idx" ON "meta_lead" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_lead_org_idx" ON "meta_lead" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_lead_lead_id_idx" ON "meta_lead" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "meta_lead_status_idx" ON "meta_lead" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meta_lead_created_idx" ON "meta_lead" USING btree ("lead_created_at");--> statement-breakpoint
CREATE INDEX "meta_lead_email_idx" ON "meta_lead" USING btree ("email");--> statement-breakpoint
CREATE INDEX "meta_conversation_page_idx" ON "meta_conversation" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_conversation_org_idx" ON "meta_conversation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meta_conversation_thread_idx" ON "meta_conversation" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "meta_conversation_platform_idx" ON "meta_conversation" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "meta_conversation_last_msg_idx" ON "meta_conversation" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "meta_conversation_attention_idx" ON "meta_conversation" USING btree ("needs_attention");--> statement-breakpoint
CREATE INDEX "meta_conversation_config_page_idx" ON "meta_conversation_config" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "meta_conversation_config_org_idx" ON "meta_conversation_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notification_org_idx" ON "notification" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_created_idx" ON "notification" USING btree ("created_at");