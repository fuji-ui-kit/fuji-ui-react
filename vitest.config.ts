import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    /* Agent worktrees live inside the repo; without this their tests (once 13 failing files) run. */
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
    /*
     * MCP tests run here though it's no workspace: it notices registry changes first, and a
     * separate runner would mean nobody runs it.
     */
    include: ["src/**/*.test.{ts,tsx}", "mcp/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "mcp/src/**/*.ts"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/index.ts"],
    },
  },
});
