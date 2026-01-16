ALTER TABLE "content_post" DROP COLUMN "publish_results";--> statement-breakpoint
ALTER TABLE "content_post_account" DROP COLUMN "publish_result";--> statement-breakpoint
CREATE TABLE "content_publish_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_post_account_id" uuid NOT NULL,
	"platform" "content_platform" NOT NULL,
	"account_name" text NOT NULL,
	"success" boolean NOT NULL,
	"platform_post_id" text,
	"permalink" text,
	"error" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_publish_result" ADD CONSTRAINT "content_publish_result_content_post_account_id_content_post_account_id_fk" FOREIGN KEY ("content_post_account_id") REFERENCES "public"."content_post_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_publish_result_account_uniq" ON "content_publish_result" USING btree ("content_post_account_id");