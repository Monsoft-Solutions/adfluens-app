import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@repo/env";

import * as schema from "./schema";

/**
 * PostgreSQL connection pool
 * Uses validated DATABASE_URL from environment configuration
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * Drizzle ORM database client
 * Configured with connection pooling and schema for type-safe queries
 */
export const db = drizzle(pool, { schema });
