CREATE TABLE "ga_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"google_account_id" text NOT NULL,
	"google_email" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"scope" text,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ga_connection_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "ga_property" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ga_connection_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"property_id" text NOT NULL,
	"property_name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"property_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ga_property" ADD CONSTRAINT "ga_property_ga_connection_id_ga_connection_id_fk" FOREIGN KEY ("ga_connection_id") REFERENCES "public"."ga_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ga_connection_org_id_idx" ON "ga_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ga_connection_status_idx" ON "ga_connection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ga_property_connection_idx" ON "ga_property" USING btree ("ga_connection_id");--> statement-breakpoint
CREATE INDEX "ga_property_org_idx" ON "ga_property" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ga_property_id_idx" ON "ga_property" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "ga_property_active_idx" ON "ga_property" USING btree ("organization_id","is_active");