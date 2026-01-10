CREATE TABLE "gmb_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"gmb_account_id" text NOT NULL,
	"gmb_location_id" text NOT NULL,
	"gmb_location_name" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"scope" text,
	"location_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gmb_connection_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE INDEX "gmb_connection_org_id_idx" ON "gmb_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gmb_connection_status_idx" ON "gmb_connection" USING btree ("status");