CREATE TABLE "scraped_page" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_profile_id" text NOT NULL,
	"page_url" text NOT NULL,
	"content" text NOT NULL,
	"scraped_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scraped_page" ADD CONSTRAINT "scraped_page_organization_profile_id_organization_profile_id_fk" FOREIGN KEY ("organization_profile_id") REFERENCES "public"."organization_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scraped_page_org_profile_id_idx" ON "scraped_page" USING btree ("organization_profile_id");--> statement-breakpoint
CREATE INDEX "scraped_page_url_idx" ON "scraped_page" USING btree ("page_url");