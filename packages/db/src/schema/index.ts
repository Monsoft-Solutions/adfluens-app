/**
 * Database schema exports
 * Aggregates all table definitions for Drizzle ORM
 */

// Channel tables
export * from "./channels.table";

// Note: Scraper schema (organization_profile) is imported directly in drizzle.config.ts
// to avoid circular dependency issues. Use @repo/scraper to access organizationProfile table.
