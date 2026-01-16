CREATE TYPE "public"."content_media_source" AS ENUM('upload', 'fal_generated', 'url');--> statement-breakpoint
CREATE TYPE "public"."content_platform" AS ENUM('facebook', 'instagram', 'gmb', 'linkedin', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."content_post_status" AS ENUM('draft', 'pending', 'published', 'failed');--> statement-breakpoint
CREATE TABLE "content_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"platforms" "content_platform"[] NOT NULL,
	"meta_page_id" uuid,
	"caption" text NOT NULL,
	"hashtags" text[],
	"media" jsonb NOT NULL,
	"status" "content_post_status" DEFAULT 'draft' NOT NULL,
	"publish_results" jsonb,
	"last_error" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_post" ADD CONSTRAINT "content_post_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_post_org_idx" ON "content_post" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "content_post_status_idx" ON "content_post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_post_meta_page_idx" ON "content_post" USING btree ("meta_page_id");--> statement-breakpoint
CREATE INDEX "content_post_created_idx" ON "content_post" USING btree ("created_at");