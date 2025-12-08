CREATE TABLE "social_media_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_media_account_id" text NOT NULL,
	"platform_post_id" text NOT NULL,
	"shortcode" text NOT NULL,
	"media_type" text NOT NULL,
	"product_type" text,
	"caption" text,
	"post_url" text,
	"thumbnail_url" text,
	"play_count" integer,
	"like_count" integer,
	"comment_count" integer,
	"video_duration" real,
	"has_audio" boolean,
	"taken_at" timestamp,
	"media_urls" jsonb,
	"scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_media_post" ADD CONSTRAINT "social_media_post_social_media_account_id_social_media_account_id_fk" FOREIGN KEY ("social_media_account_id") REFERENCES "public"."social_media_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_media_post_account_idx" ON "social_media_post" USING btree ("social_media_account_id");--> statement-breakpoint
CREATE INDEX "social_media_post_shortcode_idx" ON "social_media_post" USING btree ("shortcode");--> statement-breakpoint
CREATE INDEX "social_media_post_taken_at_idx" ON "social_media_post" USING btree ("taken_at");--> statement-breakpoint
CREATE UNIQUE INDEX "social_media_post_account_platform_id_uniq" ON "social_media_post" USING btree ("social_media_account_id","platform_post_id");