import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
  globalIgnores(["dist/**", "coverage/**", "node_modules/**", "storybook-static/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs", "*.config.ts", "vitest.setup.ts", ".storybook/main.ts"],
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
