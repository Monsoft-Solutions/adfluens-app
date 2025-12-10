import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/core/index.ts",
    "src/functions/index.ts",
    "src/models/index.ts",
    "src/prompts/index.ts",
    "src/tools/index.ts",
    "src/telemetry/index.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  noExternal: ["@repo/types"], // Bundle types
});
