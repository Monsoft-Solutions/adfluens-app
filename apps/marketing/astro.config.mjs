import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  integrations: [mdx(), sitemap()],
  site: "https://adfluens.io",
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
