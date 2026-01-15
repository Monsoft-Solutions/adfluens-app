CREATE TYPE "public"."platform_connection_status" AS ENUM('active', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."platform_source_type" AS ENUM('meta_page', 'gmb_connection', 'linkedin_connection', 'twitter_connection');--> statement-breakpoint
CREATE TABLE "content_post_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_post_id" uuid NOT NULL,
	"platform_connection_id" uuid NOT NULL,
	"status" "content_post_status" DEFAULT 'pending' NOT NULL,
	"publish_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"platform" "content_platform" NOT NULL,
	"platform_account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"account_username" text,
	"account_image_url" text,
	"source_type" "platform_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "platform_connection_status" DEFAULT 'active' NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_post_account" ADD CONSTRAINT "content_post_account_content_post_id_content_post_id_fk" FOREIGN KEY ("content_post_id") REFERENCES "public"."content_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_post_account" ADD CONSTRAINT "content_post_account_platform_connection_id_platform_connection_id_fk" FOREIGN KEY ("platform_connection_id") REFERENCES "public"."platform_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_post_account_post_idx" ON "content_post_account" USING btree ("content_post_id");--> statement-breakpoint
CREATE INDEX "content_post_account_connection_idx" ON "content_post_account" USING btree ("platform_connection_id");--> statement-breakpoint
CREATE INDEX "content_post_account_status_idx" ON "content_post_account" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_post_account_post_connection_uniq" ON "content_post_account" USING btree ("content_post_id","platform_connection_id");--> statement-breakpoint
CREATE INDEX "platform_connection_org_idx" ON "platform_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "platform_connection_platform_idx" ON "platform_connection" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "platform_connection_source_idx" ON "platform_connection" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "platform_connection_status_idx" ON "platform_connection" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_connection_org_platform_account_uniq" ON "platform_connection" USING btree ("organization_id","platform","platform_account_id");