import { base, react } from "@repo/eslint-config";

/**
 * Root ESLint configuration for the monorepo
 * Used by lint-staged during pre-commit hooks
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },
  // Apply React config to web app and UI package
  ...react.map((config) => ({
    ...config,
    files: config.files || ["**/*.ts", "**/*.tsx"],
  })),
  // Override for non-React packages (api, types) - apply base config
  ...base.map((config) => ({
    ...config,
    files: ["apps/api/**/*.ts", "packages/types/**/*.ts"],
  })),
];
