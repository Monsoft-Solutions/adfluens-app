ALTER TABLE "content_post" DROP CONSTRAINT "content_post_meta_page_id_meta_page_id_fk";
--> statement-breakpoint
DROP INDEX "content_post_meta_page_idx";--> statement-breakpoint
ALTER TABLE "content_post" DROP COLUMN "meta_page_id";