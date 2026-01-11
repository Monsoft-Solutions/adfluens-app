/**
 * Database schema exports
 * Aggregates all table definitions for Drizzle ORM
 */

// Channel tables
export * from "./channels.table";

// Organization profile tables
export * from "./organization-profile.table";
export * from "./scraped-page.table";
export * from "./social-media-account.table";
export * from "./social-media-post.table";

// GMB (Google Business Profile) tables
export * from "./gmb-connection.table";

// Meta (Facebook/Instagram) enums
export * from "./meta-enums";

// Meta (Facebook/Instagram) tables
export * from "./meta-connection.table";
export * from "./meta-page.table";
export * from "./meta-lead.table";
export * from "./meta-conversation.table";
export * from "./meta-conversation-config.table";
export * from "./meta-bot-flow.table";
export * from "./meta-conversation-state.table";
export * from "./meta-team-inbox.table";
export * from "./meta-appointment-config.table";
export * from "./meta-appointment.table";
export * from "./meta-flow-scheduled-execution.table";

// Notification tables
export * from "./notification.table";
