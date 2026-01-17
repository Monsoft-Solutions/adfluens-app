import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import * as trpcExpress from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/init";
import { auth } from "@repo/auth";
import { env } from "@repo/env";
import { Logger, loggingMiddleware } from "@repo/logger";
import { mediaStorage } from "@repo/media-storage";
import { db } from "@repo/db/client";
import { sql } from "drizzle-orm";
import {
  handleOAuthCallback as handleGoogleOAuthCallback,
  parseOAuthState,
  createPendingGoogleConnection,
} from "./features/google/google.service";
import { handleOAuthCallback as handleMetaOAuthCallback } from "./features/meta/meta.service";
import {
  handleVerification as handleMetaWebhookVerification,
  handleWebhook as handleMetaWebhook,
  verifyWebhookSignature,
} from "./features/meta/meta-webhook.handler";
import cron from "node-cron";
import { processScheduledExecutions } from "./features/meta-bot/scheduled-execution.service";
import {
  upload,
  handleFileUpload,
} from "./features/content/file-upload.handler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;
const isDev = env.NODE_ENV !== "production";
const logger = new Logger({ context: "server" });

// Trust proxy is required when running behind a load balancer (Dokploy/Traefik)
// This ensures req.protocol matches the external protocol (https)
// and prevents redirect loops or secure cookie issues
app.set("trust proxy", true);

// Configure GCS CORS on startup in development
if (isDev) {
  mediaStorage
    .configureBucketCors()
    .catch((err) => logger.error("Failed to configure GCS CORS", err));
}

// CORS Middleware - must be before auth handler
app.use(
  cors({
    origin: isDev ? env.APP_URL : true,
    credentials: true,
  })
);

// Logging middleware - sets up request context
app.use(loggingMiddleware());

/**
 * Unified Google OAuth callback
 * Handles the redirect from Google after user grants access for any Google service.
 * Exchanges the code for tokens and stores them in a secure setup session.
 * Only a setup code is passed to the frontend - NOT the actual tokens.
 *
 * The 'service' in the state determines which service is being connected (ga, gmb, gsc).
 */
app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const appUrl = env.APP_URL;

  // Handle OAuth errors
  if (oauthError) {
    const errorMessage = encodeURIComponent(
      typeof oauthError === "string" ? oauthError : "OAuth authorization failed"
    );
    return res.redirect(`${appUrl}/settings?google_error=${errorMessage}`);
  }

  // Validate required parameters
  if (typeof code !== "string" || typeof state !== "string") {
    return res.redirect(
      `${appUrl}/settings?google_error=${encodeURIComponent("Missing required OAuth parameters")}`
    );
  }

  try {
    // Parse state to get organization ID, user ID, service, and redirect path
    const { organizationId, userId, service, redirectPath } =
      parseOAuthState(state);

    if (!organizationId || !userId) {
      throw new Error("Organization ID or User ID not found in state");
    }

    // Exchange code for tokens
    const tokens = await handleGoogleOAuthCallback(code);

    // Create a pending connection to store tokens server-side
    // This prevents tokens from being exposed in URL parameters
    const pendingConnection = await createPendingGoogleConnection({
      organizationId,
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.expiresAt,
      scope: tokens.scope,
      service,
    });

    // Determine redirect parameter based on service
    const setupParam =
      service === "gmb" ? "gmb_setup_code" : "google_setup_code";

    // Redirect to frontend with ONLY the connection ID - NOT tokens
    const params = new URLSearchParams({
      [setupParam]: pendingConnection.id,
    });

    return res.redirect(`${appUrl}${redirectPath}?${params.toString()}`);
  } catch (err) {
    logger.error("Google OAuth callback failed", err);
    const errorMessage = encodeURIComponent(
      err instanceof Error ? err.message : "Failed to complete OAuth flow"
    );
    return res.redirect(`${appUrl}/settings?google_error=${errorMessage}`);
  }
});

/**
 * Meta (Facebook/Instagram) OAuth callback
 * Handles the redirect from Meta after user grants access
 * Exchanges the code for long-lived tokens and creates a pending connection.
 */
app.get("/api/auth/meta/callback", async (req, res) => {
  const { code, state, error: oauthError, error_description } = req.query;
  const appUrl = env.APP_URL;

  // Handle OAuth errors
  if (oauthError) {
    const errorMessage = encodeURIComponent(
      typeof error_description === "string"
        ? error_description
        : typeof oauthError === "string"
          ? oauthError
          : "OAuth authorization failed"
    );
    return res.redirect(`${appUrl}/settings?meta_error=${errorMessage}`);
  }

  // Validate required parameters
  if (typeof code !== "string" || typeof state !== "string") {
    return res.redirect(
      `${appUrl}/settings?meta_error=${encodeURIComponent("Missing required OAuth parameters")}`
    );
  }

  try {
    // Handle OAuth callback and create pending connection
    const { setupCode, redirectPath } = await handleMetaOAuthCallback(
      code,
      state
    );

    // Redirect to frontend with setup code
    const params = new URLSearchParams({
      meta_setup_code: setupCode,
    });

    return res.redirect(`${appUrl}${redirectPath}?${params.toString()}`);
  } catch (err) {
    logger.error("Meta OAuth callback failed", err);
    const errorMessage = encodeURIComponent(
      err instanceof Error ? err.message : "Failed to complete OAuth flow"
    );
    return res.redirect(`${appUrl}/settings?meta_error=${errorMessage}`);
  }
});

/**
 * Meta Webhook Verification (GET)
 * Called by Meta when setting up webhooks to verify the endpoint
 */
app.get("/api/webhooks/meta", handleMetaWebhookVerification);

/**
 * Meta Webhook Handler (POST)
 * Receives webhook events for leads and messages
 * Verifies X-Hub-Signature-256 header to ensure request authenticity
 */
app.post(
  "/api/webhooks/meta",
  express.json({ verify: verifyWebhookSignature }),
  handleMetaWebhook
);

/**
 * Better Auth handler
 * IMPORTANT: Must be mounted BEFORE express.json() middleware
 * Handles all auth routes at /api/auth/*
 * Note: Express v5 uses *splat syntax instead of * for wildcards
 */
app.all("/api/auth/*splat", toNodeHandler(auth));

// JSON parsing middleware - after auth handler
app.use(express.json());

/**
 * File Upload endpoint
 * Handles multipart/form-data uploads with multer
 * Must be mounted before tRPC to handle file uploads
 */
app.post("/api/content/upload", upload.array("files", 10), handleFileUpload);

/**
 * Health check endpoint
 * Verifies database connectivity for container orchestration
 */
app.get("/api/health", async (_req, res) => {
  try {
    // Test database connection with simple query
    await db.execute(sql`SELECT 1`);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: "Database connection failed",
    });
  }
});

// tRPC API with authentication context
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files in production
if (!isDev) {
  const distPath = path.join(__dirname, "..", "..", "web", "dist");
  app.use(express.static(distPath));

  logger.info("Serving static files", { distPath });

  // Handle client-side routing
  // Note: Express v5 requires named wildcards (*splat) instead of just *
  app.get("*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  logger.info("Server started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
    trpcUrl: `http://localhost:${PORT}/trpc`,
    authUrl: `http://localhost:${PORT}/api/auth`,
  });
});

// Schedule cron job for processing delayed flow executions
// Runs every minute to check for due scheduled executions
const cronLogger = new Logger({ context: "cron" });
cron.schedule("* * * * *", async () => {
  try {
    await processScheduledExecutions();
  } catch (error) {
    cronLogger.error("Failed to process scheduled executions", error);
  }
});

cronLogger.info("Scheduled execution processor started", {
  schedule: "* * * * *",
});
