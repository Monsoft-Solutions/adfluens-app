CREATE TABLE "google_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"google_account_id" text NOT NULL,
	"google_email" text,
	"google_name" text,
	"google_picture" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"granted_scopes" text,
	"enabled_services" text[] DEFAULT '{}' NOT NULL,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "google_connection_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "gmb_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_connection_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"gmb_account_id" text NOT NULL,
	"gmb_location_id" text NOT NULL,
	"location_name" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"location_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Drop FK constraint from ga_property BEFORE dropping ga_connection table
ALTER TABLE "ga_property" DROP CONSTRAINT IF EXISTS "ga_property_ga_connection_id_ga_connection_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "ga_property_connection_idx";
--> statement-breakpoint
ALTER TABLE "gmb_connection" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ga_connection" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP TABLE IF EXISTS "gmb_connection" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "ga_connection" CASCADE;
--> statement-breakpoint
ALTER TABLE "ga_property" ADD COLUMN "google_connection_id" uuid;
--> statement-breakpoint
ALTER TABLE "gmb_location" ADD CONSTRAINT "gmb_location_google_connection_id_google_connection_id_fk" FOREIGN KEY ("google_connection_id") REFERENCES "public"."google_connection"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "google_connection_org_id_idx" ON "google_connection" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "google_connection_status_idx" ON "google_connection" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "gmb_location_connection_idx" ON "gmb_location" USING btree ("google_connection_id");
--> statement-breakpoint
CREATE INDEX "gmb_location_org_idx" ON "gmb_location" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "gmb_location_id_idx" ON "gmb_location" USING btree ("gmb_location_id");
--> statement-breakpoint
CREATE INDEX "gmb_location_active_idx" ON "gmb_location" USING btree ("organization_id","is_active");
--> statement-breakpoint
ALTER TABLE "ga_property" ADD CONSTRAINT "ga_property_google_connection_id_google_connection_id_fk" FOREIGN KEY ("google_connection_id") REFERENCES "public"."google_connection"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ga_property_connection_idx" ON "ga_property" USING btree ("google_connection_id");
--> statement-breakpoint
ALTER TABLE "ga_property" DROP COLUMN IF EXISTS "ga_connection_id";
