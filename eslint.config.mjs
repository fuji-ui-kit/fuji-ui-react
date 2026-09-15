import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
  globalIgnores([
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "storybook-static/**",
    // Agent worktrees live inside the repo, so linting from the main checkout
    // otherwise reports every other branch's source - and their built `dist`
    // output - as problems on this one. Each worktree lints itself.
    ".claude/worktrees/**",
    // Build output, not source. `dist/**` above is anchored at the repo root,
    // so a fixture that has been built (which is the whole point of the
    // fixtures) otherwise drops a bundled, minified vendor file into the lint
    // run - a thousand errors about single-letter variables in React's own
    // shipped code.
    "fixtures/*/dist/**",
    ".gallery/**",
    "mcp/dist/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs", "*.config.ts", "vitest.setup.ts", ".storybook/main.ts", "mcp/src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "vitest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Test fixtures stand in for arbitrary "asChild" children (e.g. a
      // router Link); the actual shipped components already carry their own
      // a11y checks, so anchor/link-shape linting on test-only markup isn't
      // meaningful here.
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
]);
