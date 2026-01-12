import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Read API port from environment (defaults to 3001)
const API_PORT = process.env.PORT || "3001";
const API_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/trpc": {
        target: API_URL,
        changeOrigin: true,
      },
      "/api/auth": {
        target: API_URL,
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
