CREATE TABLE "social_media_account" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_profile_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"bio" text,
	"profile_pic_url" text,
	"profile_pic_url_hd" text,
	"external_url" text,
	"follower_count" integer,
	"following_count" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_business_account" boolean DEFAULT false NOT NULL,
	"platform_data" jsonb,
	"scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_media_account" ADD CONSTRAINT "social_media_account_organization_profile_id_organization_profile_id_fk" FOREIGN KEY ("organization_profile_id") REFERENCES "public"."organization_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_media_account_org_profile_idx" ON "social_media_account" USING btree ("organization_profile_id");--> statement-breakpoint
CREATE INDEX "social_media_account_platform_idx" ON "social_media_account" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "social_media_account_username_idx" ON "social_media_account" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "social_media_account_org_platform_uniq" ON "social_media_account" USING btree ("organization_profile_id","platform");