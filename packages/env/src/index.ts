import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Find monorepo root and load .env file
 * packages/env/src/index.ts -> ../../.. = monorepo root
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, "..", "..", "..");

config({ path: resolve(monorepoRoot, ".env") });

/**
 * Server-side environment variables schema
 * Validated at application startup for fail-fast behavior
 */
export const env = createEnv({
  server: {
    /** PostgreSQL connection URL */
    DATABASE_URL: z.string().url(),

    /** YouTube Data API v3 key */
    YOUTUBE_API_KEY: z.string().min(1, "YouTube API key is required"),

    /** Google Gemini AI API key */
    GEMINI_API_KEY: z.string().min(1, "Gemini API key is required"),

    /** Google OAuth credentials */
    GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),

    /** Facebook OAuth credentials */
    FACEBOOK_CLIENT_ID: z.string().min(1, "Facebook Client ID is required"),
    FACEBOOK_CLIENT_SECRET: z
      .string()
      .min(1, "Facebook Client Secret is required"),

    /** ScrapingDog API key for web scraping */
    SCRAPINGDOG_API_KEY: z.string().min(1, "ScrapingDog API key is required"),

    /** ScrapeCreator API key for social media scraping */
    SCRAPECREATOR_API_KEY: z
      .string()
      .min(1, "ScrapeCreator API key is required"),

    /** Server port (optional, defaults to 3001) */
    PORT: z.coerce.number().default(3001),

    /** Node environment */
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    /** Better Auth base URL (where API server runs) */
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),

    /** Frontend application URL (for trusted origins) */
    APP_URL: z.string().url().default("http://localhost:3000"),
  },

  /**
   * Runtime environment - reads from process.env
   * This mapping is required by @t3-oss/env-core
   */
  runtimeEnv: process.env,

  /**
   * Skip validation in certain environments
   * Useful for build-time when env vars aren't available
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined
   * This ensures empty env vars are caught by validation
   */
  emptyStringAsUndefined: true,
});

/** Export env type for external type inference */
export type Env = typeof env;
