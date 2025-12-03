import type { Config } from "tailwindcss";
import baseConfig from "@repo/ui/tailwind.config";

/**
 * Web app Tailwind configuration
 * Extends the shared UI package config for consistency
 */
const config: Config = {
  ...baseConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;

