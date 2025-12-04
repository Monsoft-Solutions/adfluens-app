import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/channels.table";

/**
 * PostgreSQL connection pool
 * Uses DATABASE_URL environment variable for connection string
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Drizzle ORM database client
 * Configured with connection pooling and schema for type-safe queries
 */
export const db = drizzle(pool, { schema });
