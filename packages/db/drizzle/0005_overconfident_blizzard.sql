CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."bot_mode" AS ENUM('ai', 'flow', 'human');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('active', 'pending', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."inbox_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('active', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."qualification_status" AS ENUM('unqualified', 'qualifying', 'qualified', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."scheduled_execution_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "meta_connection" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."connection_status";--> statement-breakpoint
ALTER TABLE "meta_connection" ALTER COLUMN "status" SET DATA TYPE "public"."connection_status" USING "status"::"public"."connection_status";--> statement-breakpoint
ALTER TABLE "meta_page" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."page_status";--> statement-breakpoint
ALTER TABLE "meta_page" ALTER COLUMN "status" SET DATA TYPE "public"."page_status" USING "status"::"public"."page_status";--> statement-breakpoint
ALTER TABLE "meta_lead" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "meta_lead" ALTER COLUMN "status" SET DATA TYPE "public"."lead_status" USING "status"::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ALTER COLUMN "ai_temperature" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ALTER COLUMN "ai_temperature" SET DEFAULT '0.70';--> statement-breakpoint
ALTER TABLE "meta_conversation_state" ALTER COLUMN "bot_mode" SET DEFAULT 'ai'::"public"."bot_mode";--> statement-breakpoint
ALTER TABLE "meta_conversation_state" ALTER COLUMN "bot_mode" SET DATA TYPE "public"."bot_mode" USING "bot_mode"::"public"."bot_mode";--> statement-breakpoint
ALTER TABLE "meta_conversation_state" ALTER COLUMN "qualification_status" SET DATA TYPE "public"."qualification_status" USING "qualification_status"::"public"."qualification_status";--> statement-breakpoint
ALTER TABLE "meta_team_inbox" ALTER COLUMN "priority" SET DEFAULT 'normal'::"public"."inbox_priority";--> statement-breakpoint
ALTER TABLE "meta_team_inbox" ALTER COLUMN "priority" SET DATA TYPE "public"."inbox_priority" USING "priority"::"public"."inbox_priority";--> statement-breakpoint
ALTER TABLE "meta_team_inbox" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."inbox_status";--> statement-breakpoint
ALTER TABLE "meta_team_inbox" ALTER COLUMN "status" SET DATA TYPE "public"."inbox_status" USING "status"::"public"."inbox_status";--> statement-breakpoint
ALTER TABLE "meta_appointment" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "meta_appointment" ALTER COLUMN "status" SET DATA TYPE "public"."appointment_status" USING "status"::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "meta_flow_scheduled_execution" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."scheduled_execution_status";--> statement-breakpoint
ALTER TABLE "meta_flow_scheduled_execution" ALTER COLUMN "status" SET DATA TYPE "public"."scheduled_execution_status" USING "status"::"public"."scheduled_execution_status";--> statement-breakpoint
CREATE INDEX "meta_conv_state_lead_score_idx" ON "meta_conversation_state" USING btree ("lead_score");--> statement-breakpoint
CREATE INDEX "meta_conv_state_last_activity_idx" ON "meta_conversation_state" USING btree ("last_bot_response_at");--> statement-breakpoint
CREATE INDEX "meta_inbox_org_status_idx" ON "meta_team_inbox" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "meta_inbox_assignee_status_idx" ON "meta_team_inbox" USING btree ("assigned_to_user_id","status");--> statement-breakpoint
CREATE INDEX "meta_appt_status_scheduled_idx" ON "meta_appointment" USING btree ("status","scheduled_at");