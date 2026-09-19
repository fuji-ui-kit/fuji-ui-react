#!/usr/bin/env node
/*
 * Installs the packed `@fujiui/mcp` tarball outside the repo, like npx, and drives it over stdio
 * from each place real clients start it. Needs `npm run build` and network; POSIX only.
 */
import { execFileSync, spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("..", import.meta.url));

if (!existsSync(join(REPO, "dist", "registry.json"))) {
  console.error("dist/registry.json is missing - run `npm run build` first.");
  process.exit(1);
}

const failures = [];
function check(label, ok, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures.push(detail ? `${label}\n${detail}` : label);
}

const work = mkdtempSync(join(tmpdir(), "fuji-mcp-smoke-"));
try {
  // 1. Pack exactly what `npm publish` would upload. `prepack` rebuilds dist/.
  const packed = execFileSync("npm", ["pack", "--pack-destination", work], {
    cwd: join(REPO, "mcp"),
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .pop();
  const tarball = join(work, packed);
  const files = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" }).trim().split("\n");
  for (const required of [
    "package.json",
    "README.md",
    "LICENSE",
    "dist/index.js",
    "dist/registry.js",
    "dist/review.js",
  ]) {
    check(`tarball contains ${required}`, files.includes(`package/${required}`));
  }
  const stray = files.filter((file) => /\.test\.|\.map$|^package\/src\//.test(file));
  check("tarball has no tests, source maps or sources", stray.length === 0, stray.join("\n"));

  // The MCP Registry verifies server.json against the npm package; check it here so drift fails
  // on the push, not after `npm publish`.
  const mcpManifest = JSON.parse(readFileSync(join(REPO, "mcp", "package.json"), "utf8"));
  const listing = JSON.parse(readFileSync(join(REPO, "mcp", "server.json"), "utf8"));
  check(
    "server.json name matches package.json mcpName",
    listing.name === mcpManifest.mcpName,
    `${listing.name} vs ${mcpManifest.mcpName}`,
  );
  check(
    "server.json versions match package.json",
    listing.version === mcpManifest.version && listing.packages?.[0]?.version === mcpManifest.version,
    `server.json ${listing.version} / ${listing.packages?.[0]?.version}, package.json ${mcpManifest.version}`,
  );
  check("server.json lists this npm package", listing.packages?.[0]?.identifier === mcpManifest.name);
  check(
    "server.json description fits the registry's 100 characters",
    (listing.description ?? "").length <= 100,
  );

  // 2. Install outside the repo and nested, so only its own `dependencies` resolve: a hoisted
  // install would let the SDK's `zod` hide a missing declaration.
  const tool = join(work, "tool");
  mkdirSync(tool);
  writeFileSync(join(tool, "package.json"), JSON.stringify({ name: "smoke-tool", private: true }));
  execFileSync(
    "npm",
    ["install", "--no-audit", "--no-fund", "--loglevel=error", "--install-strategy=nested", tarball],
    {
      cwd: tool,
      stdio: "inherit",
    },
  );
  const bin = join(tool, "node_modules", ".bin", "fuji-mcp");
  check("installs a fuji-mcp bin", existsSync(bin));

  // 3. Projects to start it from: a real install contributes package.json and the registry.
  const manifest = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
  function project(name, { version = manifest.version, registry = true } = {}) {
    const pkg = join(work, name, "node_modules", "@fujiui", "react");
    mkdirSync(join(pkg, "dist"), { recursive: true });
    writeFileSync(join(pkg, "package.json"), JSON.stringify({ ...manifest, version }));
    if (registry) copyFileSync(join(REPO, "dist", "registry.json"), join(pkg, "dist", "registry.json"));
    return join(work, name);
  }
  const app = project("app");
  const legacy = project("legacy-app", { version: "0.2.1", registry: false });
  // Stands in for ~/.claude, where Claude Code starts user-scope servers.
  const elsewhere = join(work, "dot-claude");
  mkdirSync(elsewhere);

  // A real CLAUDE_PROJECT_DIR would make scenarios pass for the wrong reason.
  const baseEnv = { ...process.env };
  delete baseEnv.CLAUDE_PROJECT_DIR;

  async function scenario(label, { cwd, env = {}, args = [], launch = [bin] }, body) {
    console.log(`\n${label}`);
    // Own process group, so the kill below reaches a grandchild server (npm 9's npx), which
    // otherwise held the pipes open until the CI timeout.
    const child = spawn(launch[0], [...launch.slice(1), ...args], {
      cwd,
      env: { ...baseEnv, ...env },
      detached: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const pending = new Map();
    child.on("exit", (code) => {
      for (const settle of pending.values())
        settle({ error: { message: `server exited (${code}): ${stderr}` } });
      pending.clear();
    });
    let buffer = "";
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      for (let at = buffer.indexOf("\n"); at !== -1; at = buffer.indexOf("\n")) {
        const line = buffer.slice(0, at);
        buffer = buffer.slice(at + 1);
        if (!line.trim()) continue;
        const message = JSON.parse(line);
        pending.get(message.id)?.(message);
        pending.delete(message.id);
      }
    });
    let nextId = 0;
    const request = (method, params) =>
      new Promise((resolve) => {
        const id = ++nextId;
        const timer = setTimeout(
          () => resolve({ error: { message: `${method} timed out: ${stderr}` } }),
          30_000,
        );
        pending.set(id, (message) => {
          clearTimeout(timer);
          resolve(message);
        });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    try {
      const init = await request("initialize", {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "fuji-smoke", version: "0" },
      });
      check("  connects", Boolean(init.result), JSON.stringify(init.error ?? init));
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
      const call = async (name, input) => {
        const reply = await request("tools/call", { name, arguments: input });
        return reply.result?.content?.[0]?.text ?? JSON.stringify(reply.error ?? reply);
      };
      const tools = async () => (await request("tools/list", {})).result?.tools ?? [];
      await body({ instructions: init.result?.instructions ?? "", call, tools });
    } finally {
      // EOF stops a stdio server; the group kill covers one that ignores it.
      child.stdin.end();
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // The group is already gone.
      }
      child.stdout.destroy();
      child.stderr.destroy();
    }
  }

  const snippet =
    'import { Button } from "@fujiui/react";\nexport const A = () => <Button theme="dark">Hi</Button>;';

  await scenario(
    "started in the project (Claude Code local/project scope)",
    { cwd: app },
    async ({ instructions, call, tools }) => {
      check("  sends usage instructions", instructions.includes("review_usage"), instructions);
      const review = await call("review_usage", { code: snippet });
      check("  review_usage flags a per-component theme prop", review.includes('"theme" prop'), review);
      const component = await call("get_component", { name: "Button" });
      check("  get_component answers", component.includes("@fujiui/react"), component);
      // Adopting apps start here; a missing stylesheet import fails silently.
      const glass = await call("get_appearance", { topic: "glass" });
      check(
        "  get_appearance answers from the installed registry",
        glass.includes("fuji-glass-atmosphere"),
        glass,
      );
      const provider = await call("get_component", { name: "FujiProvider" });
      check(
        "  FujiProvider carries the setup steps",
        provider.includes("@fujiui/react/styles.css"),
        provider.slice(0, 400),
      );
      // Required by the Connectors Directory; clients use it for auto-approval.
      const listed = await tools();
      check(
        "  every tool is marked read-only",
        // The exact set, so a new tool must be added here deliberately (and marked read-only).
        listed
          .map((tool) => tool.name)
          .sort()
          .join() === "get_appearance,get_component,list_components,review_usage" &&
          listed.every((tool) => tool.annotations?.readOnlyHint === true),
        JSON.stringify(listed.map((tool) => [tool.name, tool.annotations])),
      );
    },
  );

  await scenario(
    "started in ~/.claude with CLAUDE_PROJECT_DIR (Claude Code user scope)",
    { cwd: elsewhere, env: { CLAUDE_PROJECT_DIR: app } },
    async ({ call }) => {
      const review = await call("review_usage", { code: snippet });
      check("  answers from the named project", review.includes('"theme" prop'), review);
    },
  );

  await scenario(
    "--project from anywhere (Claude Desktop, Codex)",
    { cwd: elsewhere, args: ["--project", app] },
    async ({ call }) => {
      const listing = await call("list_components", { query: "button" });
      check("  answers from the named project", listing.includes("Button"), listing);
    },
  );

  // What mcp/README.md's install commands run: `file:` stands in for the name (a bare path would
  // run as a program), and an empty cache makes npx infer the bin, whose name isn't the package's.
  await scenario(
    "launched through npx from an empty cache (what `npx -y @fujiui/mcp` does)",
    {
      cwd: app,
      launch: ["npx", "-y", `file:${tarball}`],
      env: { npm_config_cache: join(work, "npx-cache") },
    },
    async ({ call }) => {
      const review = await call("review_usage", { code: snippet });
      check("  answers", review.includes('"theme" prop'), review);
    },
  );

  // Claude Code names the repo root as the project; pnpm only links the package into the app.
  const monorepo = join(work, "turborepo");
  mkdirSync(join(monorepo, "apps", "web", "node_modules", "@fujiui"), { recursive: true });
  writeFileSync(join(monorepo, "package.json"), JSON.stringify({ private: true }));
  writeFileSync(join(monorepo, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n');
  writeFileSync(
    join(monorepo, "apps", "web", "package.json"),
    JSON.stringify({ name: "web", dependencies: { "@fujiui/react": "^0.3.0" } }),
  );
  const store = project("turborepo/node_modules/.pnpm/@fujiui+react@0.3.0");
  symlinkSync(
    join(store, "node_modules", "@fujiui", "react"),
    join(monorepo, "apps", "web", "node_modules", "@fujiui", "react"),
    "dir",
  );
  await scenario(
    "a pnpm monorepo opened at its root (Turborepo, Nx)",
    { cwd: elsewhere, env: { CLAUDE_PROJECT_DIR: monorepo } },
    async ({ call }) => {
      const review = await call("review_usage", { code: snippet });
      check("  answers from the workspace package's install", review.includes('"theme" prop'), review);
    },
  );

  await scenario("a project that does not use Fuji", { cwd: elsewhere }, async ({ call }) => {
    const answer = await call("list_components", {});
    check("  stays up and says why", answer.includes("Could not find @fujiui/react"), answer);
  });

  await scenario("a project on a release from before registry.json", { cwd: legacy }, async ({ call }) => {
    const answer = await call("get_component", { name: "Button" });
    check(
      "  names the installed version and the upgrade",
      answer.includes("0.2.1") && answer.includes("npm install @fujiui/react@latest"),
      answer,
    );
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n\n${failures.join("\n\n")}`);
  process.exit(1);
}
console.log("\n@fujiui/mcp smoke test passed.");
