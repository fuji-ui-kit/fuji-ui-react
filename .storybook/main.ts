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
 * Vite is never told about the rewrite by its own file watcher, so this
 * plugin has to invalidate the generated stylesheets itself. `dist/` is the
 * resolved `build.outDir`, and Vite unconditionally appends `<outDir>/**` to
 * chokidar's `ignored` list whenever `emptyOutDir` is on (which it is, since
 * the directory sits inside the project root) - see `resolveChokidarOptions`
 * in vite/dist/node. An ignored path stays ignored even when it is passed to
 * `server.watcher.add()`, so no `change` event ever fires for
 * `dist/styles.css` and Vite keeps serving the transform it cached the first
 * time preview.tsx imported it - including across a full browser reload,
 * which is what makes the staleness look like a build problem rather than an
 * HMR one. Invalidating the modules explicitly after each rebuild is the only
 * reliable signal; the full reload that follows is cheap and unambiguous.
 *
 * `src/styles` is in the watch list because `scripts/css-entry.css` imports
 * tokens.css, fuji-theme.css and base.css directly. Leaving it out meant a
 * token or recipe edit - the single most common reason to want a rebuild -
 * was the one change that never triggered one.
 */
function fujiCssWatchPlugin(projectRoot: string): Plugin {
  const generatedCss = [
    join(projectRoot, "dist/styles.css"),
    join(projectRoot, ".storybook/generated/storybook.css"),
  ];

  return {
    name: "fuji-storybook-css-watch",
    configureServer(server: ViteDevServer) {
      let running: Promise<void> | null = null;
      let queued = false;

      const reloadGeneratedCss = () => {
        for (const file of generatedCss) {
          const modules = server.moduleGraph.getModulesByFile(file);
          modules?.forEach((mod) => server.moduleGraph.invalidateModule(mod));
        }
        server.ws.send({ type: "full-reload" });
      };

      const rebuild = () => {
        if (running) {
          queued = true;
          return;
        }
        running = (async () => {
          try {
            await execFileAsync("node", ["scripts/build-css.mjs"], { cwd: projectRoot });
            await execFileAsync("node", ["scripts/build-storybook-css.mjs"], { cwd: projectRoot });
            reloadGeneratedCss();
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

      const watchRoots = [
        join(projectRoot, "src/components/fuji"),
        join(projectRoot, "src/provider"),
        join(projectRoot, "src/lib"),
        join(projectRoot, "src/styles"),
        join(projectRoot, "stories"),
        join(projectRoot, ".storybook/storybook-entry.css"),
      ];
      watchRoots.forEach((path) => server.watcher.add(path));
      server.watcher.on("change", (file) => {
        // The rebuild's own output - never a reason to rebuild again.
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
  // `addon-essentials` and `addon-interactions` do not exist past Storybook 8 -
  // both were folded into core, so listing them is now an error rather than a
  // no-op. a11y is still a separate addon.
  addons: ["@storybook/addon-a11y"],
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
