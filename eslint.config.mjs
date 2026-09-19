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
    // Agent worktrees live inside the repo; each lints itself.
    ".claude/worktrees/**",
    // Built fixtures' bundled vendor code (`dist/**` above only matches the root).
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
      // Test markup stands in for arbitrary `asChild` children (e.g. a router Link); shipped
      // components carry their own a11y checks.
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
]);
