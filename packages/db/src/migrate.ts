import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "@repo/env";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations programmatically
 * This is used for Docker deployments where drizzle-kit is not available
 */
async function runMigrations() {
  console.log("🔄 Running database migrations...");

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  const db = drizzle(pool);

  // Migrations are in packages/db/drizzle
  const migrationsFolder = resolve(__dirname, "..", "drizzle");

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
