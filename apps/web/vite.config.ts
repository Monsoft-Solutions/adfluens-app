import path from "path";
import { config } from "dotenv";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Load .env from monorepo root before config is processed
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  server: {
    port: Number(process.env.VITE_PORT) || 3000,
    host: "0.0.0.0",
    proxy: {
      "/trpc": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/auth": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
