import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/schema/index.ts",
    "../auth/src/schema/auth.table.ts",
    "../scraper/src/schema/organization-profile.table.ts",
    "../scraper/src/schema/scraped-page.table.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
