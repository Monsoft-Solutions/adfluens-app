ALTER TABLE "meta_conversation_config" ADD COLUMN "auto_translate_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "supported_languages" jsonb DEFAULT '["en"]'::jsonb;--> statement-breakpoint
ALTER TABLE "meta_conversation_config" ADD COLUMN "default_language" text DEFAULT 'en';