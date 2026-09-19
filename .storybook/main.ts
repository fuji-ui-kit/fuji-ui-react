import { execFile } from "node:child_process";
import { join, sep } from "node:path";
import { promisify } from "node:util";
import type { Plugin, ViteDevServer } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const execFileAsync = promisify(execFile);

/**
 * Rebuilds both CSS files on source edits (the npm scripts build them once, outside Vite) and
 * invalidates them manually: Vite ignores `<outDir>/**`, so it would serve stale cached CSS.
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

// Not `import.meta.url`: Storybook loads this file as CJS, where it throws "require is not
// defined". The CLI always runs from the project root, so cwd is equivalent.
const projectRoot = process.cwd();

const config: StorybookConfig = {
  // Outside src/ so tsup's `src/**` glob can never ship them.
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  // Essentials/interactions are core since Storybook 9 and listing them errors; a11y is separate.
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
      // Stories import "@fujiui/react" like consumers; JS resolves to live source for HMR, while CSS
      // stays the real compiled `dist/styles.css` (see preview.tsx).
      { find: "@fujiui/react", replacement: join(projectRoot, "src/index.ts") },
    ];
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(fujiCssWatchPlugin(projectRoot));
    return viteConfig;
  },
};

export default config;
