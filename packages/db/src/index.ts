// Re-export database client
export { db } from "./client";

// Re-export schema tables
export { channelsTable } from "./schema";

// Re-export drizzle-orm utilities for convenience
export { eq, and, or, desc, asc, sql } from "drizzle-orm";

// Inferred types from schema
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { channelsTable } from "./schema";

/** Type for selecting a channel from the database */
export type ChannelRow = InferSelectModel<typeof channelsTable>;

/** Type for inserting a new channel into the database */
export type ChannelInsert = InferInsertModel<typeof channelsTable>;
