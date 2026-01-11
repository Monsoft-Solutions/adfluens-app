import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://adfluens.com",
  output: "static",
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
  },
});
