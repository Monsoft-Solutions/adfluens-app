DROP INDEX "organization_profile_org_id_idx";--> statement-breakpoint
DROP INDEX "google_connection_org_id_idx";--> statement-breakpoint
DROP INDEX "meta_connection_org_id_idx";--> statement-breakpoint
DROP INDEX "meta_lead_lead_id_idx";--> statement-breakpoint
DROP INDEX "meta_conversation_config_page_idx";--> statement-breakpoint
DROP INDEX "meta_conv_state_conv_idx";--> statement-breakpoint
DROP INDEX "meta_appt_config_page_idx";--> statement-breakpoint
ALTER TABLE "gmb_location" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."connection_status";--> statement-breakpoint
ALTER TABLE "gmb_location" ALTER COLUMN "status" SET DATA TYPE "public"."connection_status" USING "status"::"public"."connection_status";--> statement-breakpoint
ALTER TABLE "ga_property" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."connection_status";--> statement-breakpoint
ALTER TABLE "ga_property" ALTER COLUMN "status" SET DATA TYPE "public"."connection_status" USING "status"::"public"."connection_status";