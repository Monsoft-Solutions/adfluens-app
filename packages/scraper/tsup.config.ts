import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  noExternal: ["@repo/types"], // Bundle types into the package
  external: ["@monsoft/ai"], // Keep as peer dependency
});
