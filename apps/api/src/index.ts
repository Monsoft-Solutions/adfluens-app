import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import * as trpcExpress from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/init";
import { auth } from "@repo/auth";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== "production";

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
  app.get("*", (req, res) => {
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
