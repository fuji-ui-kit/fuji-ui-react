import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadRegistry, type LoadOptions } from "./registry.js";

/**
 * Each case is a real client: Claude Code local/project scope (cwd), user scope (`~/.claude`,
 * only `CLAUDE_PROJECT_DIR`), Desktop (`--project`). `env`/`cwd` are injected so real ones can't leak.
 */
const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "fuji-mcp-")));
  temps.push(dir);
  return dir;
}

/** A project with `@fujiui/react` installed; `registry: false` is a release predating the file. */
function project(version: string, { registry = true } = {}): string {
  const root = tempDir();
  const pkg = path.join(root, "node_modules", "@fujiui", "react");
  fs.mkdirSync(path.join(pkg, "dist"), { recursive: true });
  fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "@fujiui/react", version }));
  if (registry) {
    fs.writeFileSync(
      path.join(pkg, "dist", "registry.json"),
      JSON.stringify({
        schemaVersion: 1,
        package: { name: "@fujiui/react", version, import: "@fujiui/react", styles: [] },
        conventions: [],
        categories: [],
        exports: { values: [], types: [] },
        index: [],
        components: [],
      }),
    );
  }
  return root;
}

const versionOf = (options: LoadOptions) => loadRegistry(options).registry.package.version;

function messageOf(options: LoadOptions): string {
  try {
    loadRegistry(options);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected loadRegistry to throw");
}

describe("loadRegistry", () => {
  it("reads the project CLAUDE_PROJECT_DIR names when started somewhere else (Claude Code user scope)", () => {
    expect(versionOf({ cwd: tempDir(), env: { CLAUDE_PROJECT_DIR: project("1.0.0") } })).toBe("1.0.0");
  });

  it("falls back to the working directory (local and project scopes)", () => {
    expect(versionOf({ cwd: project("1.0.0"), env: {} })).toBe("1.0.0");
  });

  it("prefers CLAUDE_PROJECT_DIR over the working directory", () => {
    expect(versionOf({ cwd: project("2.0.0"), env: { CLAUDE_PROJECT_DIR: project("1.0.0") } })).toBe("1.0.0");
  });

  it("prefers --project over both", () => {
    expect(
      versionOf({
        projectDir: project("1.0.0"),
        cwd: project("3.0.0"),
        env: { CLAUDE_PROJECT_DIR: project("2.0.0") },
      }),
    ).toBe("1.0.0");
  });

  it("never falls through past an explicit --project to a different install", () => {
    expect(messageOf({ projectDir: tempDir(), cwd: project("1.0.0"), env: {} })).toContain(
      "Could not find @fujiui/react",
    );
  });

  it("rejects a --project that is not a directory", () => {
    expect(messageOf({ projectDir: path.join(tempDir(), "missing"), env: {} })).toMatch(
      /--project .* is not a directory/,
    );
  });

  it("reads an explicit --registry", () => {
    const file = path.join(project("4.0.0"), "node_modules", "@fujiui", "react", "dist", "registry.json");
    expect(versionOf({ registryPath: file, cwd: tempDir(), env: {} })).toBe("4.0.0");
  });

  it("rejects a --registry that does not exist rather than guessing", () => {
    expect(
      messageOf({ registryPath: path.join(tempDir(), "registry.json"), cwd: project("1.0.0"), env: {} }),
    ).toContain("does not exist");
  });

  it("names the installed version and the upgrade when it predates registry.json", () => {
    const message = messageOf({ cwd: project("0.2.1", { registry: false }), env: {} });
    expect(message).toContain("@fujiui/react@0.2.1");
    expect(message).toContain("npm install @fujiui/react@latest");
  });

  it("stops at the project's own install instead of answering from a different version", () => {
    // The named project is outdated; the newer cwd install would describe props it doesn't have.
    const message = messageOf({
      cwd: project("2.0.0"),
      env: { CLAUDE_PROJECT_DIR: project("0.2.1", { registry: false }) },
    });
    expect(message).toContain("@fujiui/react@0.2.1");
  });

  it("says where it looked when nothing is installed", () => {
    const empty = tempDir();
    const message = messageOf({ cwd: empty, env: {} });
    expect(message).toContain("Could not find @fujiui/react");
    expect(message).toContain(empty);
  });
});

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

/** `@fujiui/react` installed into `dir/node_modules`. Returns the package root. */
function installInto(dir: string, version: string, { registry = true } = {}): string {
  const pkg = path.join(dir, "node_modules", "@fujiui", "react");
  writeJson(path.join(pkg, "package.json"), { name: "@fujiui/react", version });
  if (registry) {
    writeJson(path.join(pkg, "dist", "registry.json"), {
      schemaVersion: 1,
      package: { name: "@fujiui/react", version, import: "@fujiui/react", styles: [] },
      conventions: [],
      categories: [],
      exports: { values: [], types: [] },
      index: [],
      components: [],
    });
  }
  return pkg;
}

/** A workspace package at `root/dir`. Depends on Fuji unless told otherwise. */
function workspace(
  root: string,
  dir: string,
  dependencies: Record<string, string> = { "@fujiui/react": "^1.0.0" },
) {
  const full = path.join(root, dir);
  writeJson(path.join(full, "package.json"), { name: path.basename(dir), dependencies });
  return full;
}

/** How Claude Code starts the server for a repository opened at its root. */
const atRoot = (root: string): LoadOptions => ({ cwd: root, env: { CLAUDE_PROJECT_DIR: root } });

/**
 * A monorepo opened at its root (Claude Code's project dir); pnpm, and unhoisted npm/Yarn
 * workspaces, once answered "Could not find @fujiui/react" here.
 */
describe("loadRegistry in a monorepo opened at its root", () => {
  it("finds pnpm's install, linked into a workspace package from the store", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true });
    fs.writeFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      'packages:\n  - "apps/*"\n  # tooling\n  - packages/*\n',
    );
    const web = workspace(root, "apps/web");
    const stored = installInto(path.join(root, "node_modules", ".pnpm", "@fujiui+react@1.0.0"), "1.0.0");
    fs.mkdirSync(path.join(web, "node_modules", "@fujiui"), { recursive: true });
    fs.symlinkSync(stored, path.join(web, "node_modules", "@fujiui", "react"), "dir");

    const { registry, origin } = loadRegistry(atRoot(root));
    expect(registry.package.version).toBe("1.0.0");
    expect(origin).toContain("workspace apps/web");
  });

  it("reads pnpm-workspace.yaml's flow-sequence form", () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages: ['apps/*']\n");
    installInto(workspace(root, "apps/web"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });

  it("finds an npm workspace package's own install when it was not hoisted", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    installInto(workspace(root, "apps/web"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });

  it("reads Yarn classic's object form of workspaces", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: { packages: ["packages/*"] } });
    installInto(workspace(root, "packages/ui"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });

  it("follows a ** pattern into nested packages", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["packages/**"] });
    installInto(workspace(root, "packages/web/app"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });

  it("honours a negated pattern", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*", "!apps/legacy"] });
    installInto(workspace(root, "apps/legacy"), "1.0.0");
    expect(messageOf(atRoot(root))).toContain("Could not find @fujiui/react");
  });

  it("ignores a workspace package that has it installed but does not depend on it", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    installInto(workspace(root, "apps/web", { react: "^19.0.0" }), "1.0.0");
    expect(messageOf(atRoot(root))).toContain("Could not find @fujiui/react");
  });

  it("answers from the version several packages share", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    installInto(workspace(root, "apps/web"), "1.0.0");
    installInto(workspace(root, "apps/docs"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });

  it("refuses to pick between two versions, and names both", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    installInto(workspace(root, "apps/web"), "1.0.0");
    installInto(workspace(root, "apps/docs"), "2.0.0");
    const message = messageOf(atRoot(root));
    for (const expected of ["apps/web", "1.0.0", "apps/docs", "2.0.0", "--project"]) {
      expect(message).toContain(expected);
    }
  });

  it("says when a workspace package lists it but nothing is installed yet", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    workspace(root, "apps/web");
    const message = messageOf(atRoot(root));
    expect(message).toContain("apps/web/package.json");
    expect(message).toContain("not installed");
  });

  it("explains Yarn Plug'n'Play rather than reporting nothing installed", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { dependencies: { "@fujiui/react": "^1.0.0" } });
    fs.writeFileSync(path.join(root, ".pnp.cjs"), "");
    expect(messageOf(atRoot(root))).toContain("Plug'n'Play");
  });
});

/**
 * Scan budgets: one shared 5,000-entry budget that counted files let `packages/**` starve a later
 * `apps/*`, which then silently found nothing.
 */
describe("loadRegistry scanning workspace patterns", () => {
  it("does not count files against the scan", () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "packages/**"\n  - "apps/*"\n');
    const ui = workspace(root, "packages/ui", { react: "^19.0.0" });
    for (let d = 0; d < 4; d++) {
      const folder = path.join(ui, "src", `module-${d}`);
      fs.mkdirSync(folder, { recursive: true });
      for (let f = 0; f < 100; f++) fs.writeFileSync(path.join(folder, `file-${f}.ts`), "");
    }
    installInto(workspace(root, "apps/web"), "1.0.0");
    // Six directories and 400 files under packages/**, against a limit of 20.
    expect(versionOf({ ...atRoot(root), scanLimit: 20 })).toBe("1.0.0");
  });

  it("gives every pattern its own budget, so a wide one cannot starve the next", () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "packages/**"\n  - "apps/*"\n');
    const ui = workspace(root, "packages/ui", { react: "^19.0.0" });
    for (let d = 0; d < 30; d++) fs.mkdirSync(path.join(ui, "src", `module-${d}`), { recursive: true });
    installInto(workspace(root, "apps/web"), "1.0.0");
    expect(versionOf({ ...atRoot(root), scanLimit: 10 })).toBe("1.0.0");
  });

  it("says it stopped, rather than that nothing is installed, when a pattern is too wide to finish", () => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "packages/**"\n');
    // A single chain deeper than the limit, so the result does not depend on
    // the order the filesystem lists directories in.
    const deep = path.join("packages", "a", ...Array.from({ length: 12 }, (_, i) => `level-${i}`), "app");
    installInto(workspace(root, deep), "1.0.0");
    const message = messageOf({ ...atRoot(root), scanLimit: 10 });
    expect(message).toContain("Stopped scanning");
    expect(message).toContain("packages/**");
  });

  it("explains Yarn Plug'n'Play in a monorepo, instead of asking for an install that cannot help", () => {
    const root = tempDir();
    writeJson(path.join(root, "package.json"), { private: true, workspaces: ["apps/*"] });
    fs.writeFileSync(path.join(root, ".pnp.cjs"), "");
    workspace(root, "apps/web");
    const message = messageOf(atRoot(root));
    expect(message).toContain("Plug'n'Play");
    expect(message).not.toContain("not installed");
  });
});

/**
 * Real-world pnpm-workspace.yaml: the first reader required indented items and kept trailing
 * comments in the pattern, so both of these valid files failed.
 */
describe("loadRegistry reading pnpm-workspace.yaml as people write it", () => {
  it.each([
    ["a quoted item with a trailing comment", 'packages:\n  - "apps/*" # the apps\n'],
    ["a bare item with a trailing comment", "packages:\n  - apps/* # the apps\n"],
    ["items level with the key", 'packages:\n- "apps/*"\n'],
    ["a flow sequence with a trailing comment", "packages: ['apps/*'] # the apps\n"],
    ["a flow sequence over several lines", "packages: [\n  'packages/*',\n  'apps/*',\n]\n"],
    ["another key after the list", 'packages:\n  - "apps/*"\ncatalog:\n  react: ^19.0.0\n'],
  ])("%s", (_label, yaml) => {
    const root = tempDir();
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), yaml);
    installInto(workspace(root, "apps/web"), "1.0.0");
    expect(versionOf(atRoot(root))).toBe("1.0.0");
  });
});
