import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [mdx()],
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
