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
import { mediaStorage } from "@repo/media-storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;
const isDev = env.NODE_ENV !== "production";

// Trust proxy is required when running behind a load balancer (Dokploy/Traefik)
// This ensures req.protocol matches the external protocol (https)
// and prevents redirect loops or secure cookie issues
app.set("trust proxy", true);

// Configure GCS CORS on startup in development
if (isDev) {
  mediaStorage
    .configureBucketCors()
    // .then(() => console.log("✅ GCS Bucket CORS configured"))
    .catch((err) => console.error("❌ Failed to configure GCS CORS:", err));
}

// CORS Middleware - must be before auth handler
app.use(
  cors({
    origin: isDev ? "http://localhost:3000" : true,
    credentials: true,
  })
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

  // Handle client-side routing
  // Note: Express v5 requires named wildcards (*splat) instead of just *
  app.get("*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isDev) {
    console.log(`📦 tRPC API available at http://localhost:${PORT}/trpc`);
    console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
  }
});
