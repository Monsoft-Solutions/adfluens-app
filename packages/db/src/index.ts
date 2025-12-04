// Re-export database client
export { db } from "./client";

// Re-export schema tables
export * from "./schema";

// Re-export drizzle-orm utilities for convenience
export { eq, and, or, desc, asc, sql } from "drizzle-orm";

// Inferred types from schema
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { channels } from "./schema";

/** Type for selecting a channel from the database */
export type Channel = InferSelectModel<typeof channels>;

/** Type for inserting a new channel into the database */
export type NewChannel = InferInsertModel<typeof channels>;
