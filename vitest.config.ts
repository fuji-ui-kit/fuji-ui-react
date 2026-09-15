import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    /*
     * Agent worktrees are checked out INSIDE the repo at `.claude/worktrees/`,
     * so without this every branch's tests are collected alongside this one's.
     * That silently reported other branches' state as this package's - a
     * worktree with different dependencies installed contributed 13 failing
     * files and ~100 extra passing tests to a run that looked like ours.
     */
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
    /*
     * The MCP server is not an npm workspace (see ARCHITECTURE.md), but it has
     * its own tsconfig and its
     * tests belong to this run - it is the consumer that would notice a
     * registry schema change first, and a separate runner would just mean
     * nobody runs it.
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
