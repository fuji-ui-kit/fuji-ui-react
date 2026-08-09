import { execFile } from "node:child_process";
import { join, sep } from "node:path";
import { promisify } from "node:util";
import type { Plugin, ViteDevServer } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const execFileAsync = promisify(execFile);

/**
 * `npm run storybook`/`storybook:build` only run build-css.mjs and
 * build-storybook-css.mjs ONCE, before Vite starts - they are plain Node
 * scripts, not part of Vite's own module graph, so Vite's dev server has no
 * way to know a component's Tailwind classes changed and dist/styles.css /
 * .storybook/generated/storybook.css need regenerating. Left alone, a long-
 * running `storybook dev` session silently drifts from source: the same
 * failure mode a `git status`-clean checkout doesn't have, but a session that
 * started before the most recent component edit does. This plugin re-runs
 * both scripts whenever a file that can affect either compiled stylesheet
 * changes, so `storybook dev` never needs a manual restart to reflect a
 * Tailwind class edit.
 *
 * `dist/` and `.storybook/generated/` are build output, outside the set of
 * files Vite's dev server watches by default - without explicitly adding
 * them, Vite never notices this plugin rewrote them, so its own CSS-HMR
 * pipeline keeps serving the stale transform it cached the first time each
 * file was imported. Re-adding them to the watcher (separately from the
 * source paths that *trigger* a rebuild, below) routes the rewrite through
 * Vite's normal `change` handling, which invalidates and hot-updates the
 * `import "../dist/styles.css"` module in preview.tsx on its own.
 */
function fujiCssWatchPlugin(projectRoot: string): Plugin {
  let running: Promise<void> | null = null;
  let queued = false;

  const rebuild = () => {
    if (running) {
      queued = true;
      return;
    }
    running = (async () => {
      try {
        await execFileAsync("node", ["scripts/build-css.mjs"], { cwd: projectRoot });
        await execFileAsync("node", ["scripts/build-storybook-css.mjs"], { cwd: projectRoot });
      } catch (error) {
        console.error("[fuji] Storybook CSS rebuild failed:", error);
      } finally {
        running = null;
        if (queued) {
          queued = false;
          rebuild();
        }
      }
    })();
  };

  return {
    name: "fuji-storybook-css-watch",
    configureServer(server: ViteDevServer) {
      const generatedCss = [
        join(projectRoot, "dist/styles.css"),
        join(projectRoot, ".storybook/generated/storybook.css"),
      ];
      const watchRoots = [
        join(projectRoot, "src/components/fuji"),
        join(projectRoot, "src/provider"),
        join(projectRoot, "src/lib"),
        join(projectRoot, "stories"),
        join(projectRoot, ".storybook/storybook-entry.css"),
        ...generatedCss,
      ];
      watchRoots.forEach((path) => server.watcher.add(path));
      server.watcher.on("change", (file) => {
        // The rebuild's own output: let Vite's normal CSS-HMR handle these,
        // not another rebuild (which would just loop).
        if (generatedCss.includes(file)) return;
        if (file.includes(`${sep}dist${sep}`) || file.includes(`${sep}generated${sep}`)) return;
        if (/\.(tsx?|css)$/.test(file) && !file.includes(".test.")) rebuild();
      });
    },
  };
}

// Storybook's own config loader transpiles this file through esbuild-register
// in CJS mode regardless of this package's `"type": "module"` - `import.meta.url`
// there produces a `require(...)` interop shim that then fails at runtime
// ("require is not defined in ES module scope"). `process.cwd()` sidesteps it;
// Storybook always invokes its CLI from the project root, so it's equivalent
// to `__dirname` here.
const projectRoot = process.cwd();

const config: StorybookConfig = {
  // Stories live at the repo root, not under src/, specifically so tsup's
  // `src/**/*.{ts,tsx}` build glob (see tsup.config.ts) can never pick them up
  // and ship them as part of the published package.
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = [
      ...(Array.isArray(viteConfig.resolve.alias) ? viteConfig.resolve.alias : []),
      // Stories import from "@fujiui/react", exactly like a real consumer -
      // this alias points that at the live TypeScript source (fast HMR while
      // authoring components) rather than requiring a `tsup` build between
      // every edit. Only the JS/TSX side is aliased; CSS is loaded from the
      // real compiled `dist/styles.css` in preview.tsx (see its own comment)
      // so the stylesheet previewed here is the one consumers actually get.
      { find: "@fujiui/react", replacement: join(projectRoot, "src/index.ts") },
    ];
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(fujiCssWatchPlugin(projectRoot));
    return viteConfig;
  },
};

export default config;
