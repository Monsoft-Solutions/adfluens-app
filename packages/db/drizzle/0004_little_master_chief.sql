CREATE TABLE "meta_flow_scheduled_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"meta_page_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"flow_id" uuid NOT NULL,
	"next_node_id" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"conversation_context" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "meta_flow_scheduled_execution" ADD CONSTRAINT "meta_flow_scheduled_execution_meta_page_id_meta_page_id_fk" FOREIGN KEY ("meta_page_id") REFERENCES "public"."meta_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_flow_scheduled_execution" ADD CONSTRAINT "meta_flow_scheduled_execution_conversation_id_meta_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."meta_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_flow_scheduled_execution" ADD CONSTRAINT "meta_flow_scheduled_execution_flow_id_meta_bot_flow_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."meta_bot_flow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_sched_exec_due_idx" ON "meta_flow_scheduled_execution" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "meta_sched_exec_conv_idx" ON "meta_flow_scheduled_execution" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "meta_sched_exec_flow_idx" ON "meta_flow_scheduled_execution" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "meta_sched_exec_org_idx" ON "meta_flow_scheduled_execution" USING btree ("organization_id");