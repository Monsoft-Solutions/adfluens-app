/**
 * Commitlint configuration for conventional commits
 * @see https://commitlint.js.org
 *
 * Valid commit prefixes:
 * - feat: A new feature
 * - fix: A bug fix
 * - docs: Documentation only changes
 * - style: Changes that do not affect the meaning of the code
 * - refactor: A code change that neither fixes a bug nor adds a feature
 * - perf: A code change that improves performance
 * - test: Adding missing tests or correcting existing tests
 * - build: Changes that affect the build system or external dependencies
 * - ci: Changes to our CI configuration files and scripts
 * - chore: Other changes that don't modify src or test files
 * - revert: Reverts a previous commit
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};
