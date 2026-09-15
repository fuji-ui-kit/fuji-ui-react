import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The shape of `@fujiui/react/registry.json`. Only the parts this server
 * reads are typed; the artifact carries more.
 */
export interface Prop {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  deprecated?: string | boolean;
  /** Allowed values, when the type is a union of string literals. */
  values?: string[];
}

export interface Part {
  name: string;
  dotAccess: string;
  namedExport?: string;
  extends?: string;
  props: Prop[];
}

export interface Component {
  name: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  keywords: string[];
  import: string;
  source: string;
  clientComponent: boolean;
  propsType?: string;
  extends?: string;
  props: Prop[];
  parts?: { rootRenderable: boolean; items: Part[] };
  examples: { title: string; description?: string; code: string }[];
}

export interface IndexEntry {
  name: string;
  slug: string;
  category: string;
  summary: string;
  title?: string;
}

export interface Rule {
  id: string;
  rule: string;
  good: string;
  bad: string;
  source: string;
}

export interface Registry {
  schemaVersion: number;
  package: { name: string; version: string; import: string; styles: string[] };
  conventions: Rule[];
  setup: Record<string, unknown>;
  categories: string[];
  /**
   * Exported type aliases and interfaces. An alias carries its `type` text and,
   * for a union of string literals, its `values`. An interface carries
   * `type: "interface"` plus its `fields` - which is how `SelectItem`,
   * `DataTableColumn` and the other item shapes are described.
   */
  types: Record<
    string,
    {
      type: string;
      values?: string[];
      typeParameters?: string[];
      extends?: string;
      fields?: { name: string; type: string; required: boolean }[];
    }
  >;
  exports: { values: string[]; types: string[] };
  index: IndexEntry[];
  components: Component[];
  tokens: { notes: string[]; groups: Record<string, string[]>; values: Record<string, unknown> };
  guides: { id: string; title: string; summary?: string; path: string; bytes: number }[];
  stats: Record<string, number>;
}

export interface LoadedRegistry {
  registry: Registry;
  /** Where it came from, reported on startup so a version mismatch is visible. */
  origin: string;
  /** The installed package root, for reading `docs/` when a guide is asked for. */
  packageRoot?: string;
}

/** Where to look. Every field is optional; `loadRegistry` documents the order. */
export interface LoadOptions {
  /** `--registry <file>`: read exactly this file. */
  registryPath?: string;
  /** `--project <dir>`: the project whose installed `@fujiui/react` to read. */
  projectDir?: string;
  /**
   * Defaults to `process.env`. Injectable because the tests run inside Claude
   * Code often enough that a real `CLAUDE_PROJECT_DIR` would make them pass for
   * the wrong reason.
   */
  env?: Record<string, string | undefined>;
  /** Defaults to `process.cwd()`. */
  cwd?: string;
  /** Directories one workspace pattern may scan. Defaults to `SCAN_LIMIT`; tests lower it. */
  scanLimit?: number;
}

const SCHEMA_VERSION = 1;

/** The first `@fujiui/react` release that ships `dist/registry.json`. */
const FIRST_REGISTRY_RELEASE = "0.3.0";

/**
 * Finds the registry of the `@fujiui/react` the caller's project has installed,
 * so every answer describes the version they actually build against.
 *
 * In order, stopping at the first install found:
 *
 * 1. `--registry <file>` - that file, and nothing else.
 * 2. `--project <dir>` - that project, and nothing else.
 * 3. `CLAUDE_PROJECT_DIR`. Claude Code sets it for every scope, and for its
 *    user scope it is the ONLY pointer to the project: those servers start in
 *    `~/.claude`, so a lookup from the working directory alone found nothing,
 *    in every project, for everyone who installed this server that way.
 * 4. The working directory - Claude Code's local and project scopes, and most
 *    other clients.
 * 5. Where this server is itself installed, for a project that has it as a
 *    devDependency but starts it from somewhere else.
 *
 * For 2-4, a directory that is a monorepo root with nothing installed at the
 * root is searched through its workspace packages - see `workspaceInstall`.
 *
 * Stopping at the first install matters. If that project is on a release from
 * before the registry shipped, the answer is "upgrade" - not a quiet fall-through
 * to some other install whose props do not match the code being written.
 *
 * `@fujiui/react` exports `./registry.json`, but resolving that entry directly
 * needs an import assertion and fails on a package version that predates it.
 * Resolving `./package.json` - exported since the beginning - and joining the
 * path works against every version, and lets the "this package is too old"
 * case be reported as a clear message rather than a resolver error.
 */
export function loadRegistry(options: LoadOptions = {}): LoadedRegistry {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const scanLimit = options.scanLimit ?? SCAN_LIMIT;

  if (options.registryPath) {
    // An explicit path is an instruction, not a hint. Falling through to
    // auto-discovery on a typo answers every question from a different registry
    // than the one that was asked for, and says so only on stderr.
    const path = resolve(cwd, options.registryPath);
    if (!existsSync(path)) {
      throw new Error(`--registry ${options.registryPath} does not exist (resolved to ${path}).`);
    }
    return { registry: readRegistry(path), origin: `--registry ${options.registryPath}` };
  }

  const searched: string[] = [];
  for (const place of placesToLook(options.projectDir, env, cwd)) {
    searched.push(place.dir);
    const direct = installedRoot(place.dir);
    // Plug'n'Play first. A PnP workspace has no node_modules, so the workspace
    // lookup below would report the package as listed but not installed - and
    // running the install, which is what that message says to do, never fixes it.
    if (!direct && place.project && usesPlugAndPlay(place.dir) && projectUsesFuji(place.dir, scanLimit)) {
      throw new Error(
        `${place.dir} uses Yarn Plug'n'Play, which keeps packages inside zip archives this server cannot read. ` +
          `Either set \`nodeLinker: node-modules\` in .yarnrc.yml and run \`yarn install\`, or run ` +
          `\`yarn unplug @fujiui/react\` and pass --registry with the path to dist/registry.json inside ` +
          `the folder it creates under .yarn/unplugged/.`,
      );
    }
    const found = direct
      ? { root: direct, via: place.via }
      : place.project
        ? workspaceInstall(place.dir, place.via, scanLimit)
        : undefined;
    if (!found) continue;
    const path = join(found.root, "dist", "registry.json");
    if (!existsSync(path)) {
      throw new Error(
        `Found @fujiui/react@${installedVersion(found.root)} in ${found.root}, but that release predates registry.json, ` +
          `which this server reads. It first shipped in @fujiui/react ${FIRST_REGISTRY_RELEASE}. ` +
          `Upgrade the project: npm install @fujiui/react@latest`,
      );
    }
    return {
      registry: readRegistry(path),
      origin: `@fujiui/react in ${found.root}${found.via}`,
      packageRoot: found.root,
    };
  }

  throw new Error(
    `Could not find @fujiui/react. Looked from: ${[...new Set(searched)].join(", ")}.\n` +
      `Start this server from a project that depends on @fujiui/react ${FIRST_REGISTRY_RELEASE} or later, ` +
      `or pass --project <path to that project>.`,
  );
}

function placesToLook(
  projectDir: string | undefined,
  env: Record<string, string | undefined>,
  cwd: string,
): { dir: string; via: string; project: boolean }[] {
  if (projectDir) {
    const dir = resolve(cwd, projectDir);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new Error(`--project ${projectDir} is not a directory (resolved to ${dir}).`);
    }
    // Explicit, like --registry: never fall through to a different project.
    return [{ dir, via: " (--project)", project: true }];
  }
  const places: { dir: string; via: string; project: boolean }[] = [];
  if (env.CLAUDE_PROJECT_DIR) {
    places.push({ dir: resolve(env.CLAUDE_PROJECT_DIR), via: " (CLAUDE_PROJECT_DIR)", project: true });
  }
  places.push({ dir: cwd, via: "", project: true });
  places.push({ dir: dirname(fileURLToPath(import.meta.url)), via: "", project: false });
  return places;
}

/** The root of the `@fujiui/react` Node would resolve from `dir`, if there is one. */
function installedRoot(dir: string): string | undefined {
  try {
    // `createRequire` wants a file inside the directory; it need not exist.
    return dirname(createRequire(join(dir, "noop.js")).resolve("@fujiui/react/package.json"));
  } catch {
    return undefined;
  }
}

/**
 * A monorepo opened at its root, with `@fujiui/react` installed in a workspace
 * package rather than at the root. That is always the case under pnpm - and so
 * under Turborepo or Nx on pnpm - and under npm or Yarn whenever a package pins a
 * version the others do not share. Claude Code names the repository root as
 * the project, so resolving from there alone answered "Could not find
 * @fujiui/react" in exactly the kind of existing project most likely to adopt
 * a component library. Measured on a pnpm workspace before this existed.
 *
 * Answers must match the code being written, so two different versions across
 * the workspace is a question for the user, not a choice to make silently.
 */
function workspaceInstall(
  root: string,
  via: string,
  scanLimit: number,
): { root: string; via: string } | undefined {
  const { packages, truncated } = workspacePackages(root, scanLimit);
  if (!packages.length && !truncated.length) return undefined;

  const installs = new Map<string, string[]>();
  const notInstalled: string[] = [];
  for (const dir of packages) {
    if (!dependsOnFuji(dir)) continue;
    const installed = installedRoot(dir);
    if (installed) installs.set(installed, [...(installs.get(installed) ?? []), relative(root, dir)]);
    else notInstalled.push(relative(root, dir));
  }

  if (!installs.size) {
    if (notInstalled.length) {
      throw new Error(
        `@fujiui/react is listed in ${notInstalled.map((dir) => `${dir}/package.json`).join(", ")} but is not ` +
          `installed. Run your package manager's install, then try again.`,
      );
    }
    if (truncated.length) {
      // An explicit stop rather than "Could not find" for a package that may
      // sit just past the limit.
      throw new Error(
        `Stopped scanning ${truncated.map((pattern) => `"${pattern}"`).join(", ")} in ${root} after ${scanLimit} ` +
          `directories without finding @fujiui/react. Open the agent in the package you are working in, or pass ` +
          `--project <path to that package>.`,
      );
    }
    return undefined;
  }

  const byVersion = new Map<string, { root: string; users: string[] }[]>();
  for (const [installed, users] of installs) {
    const version = installedVersion(installed);
    byVersion.set(version, [...(byVersion.get(version) ?? []), { root: installed, users }]);
  }
  if (byVersion.size > 1) {
    const versions = [...byVersion]
      .map(([version, entries]) => `${entries.flatMap((entry) => entry.users).join(", ")} on ${version}`)
      .join("; ");
    throw new Error(
      `This monorepo uses more than one @fujiui/react version (${versions}). Answers have to match the code ` +
        `being written, so pass --project <path to the package you are working in>.`,
    );
  }
  const [chosen] = [...byVersion.values()][0]!;
  return { root: chosen!.root, via: `${via} (workspace ${chosen!.users[0]})` };
}

/**
 * Workspace package directories declared by `package.json` `workspaces` (npm,
 * Yarn, Bun - as an array, or Yarn classic's `{ packages: [...] }`) and by
 * `pnpm-workspace.yaml`. Patterns support what those files actually contain:
 * literal paths, `*` within one directory name, `**` for any depth, and a
 * leading `!` to exclude.
 */
function workspacePackages(root: string, scanLimit: number): { packages: string[]; truncated: string[] } {
  const include = new Set<string>();
  const exclude = new Set<string>();
  const truncated: string[] = [];
  for (const raw of workspacePatterns(root)) {
    const negated = raw.startsWith("!");
    const pattern = (negated ? raw.slice(1) : raw).replace(/^\.\//, "").replace(/\/+$/, "");
    if (!pattern) continue;
    // A budget per pattern. One shared budget let a wide `packages/**` over a
    // large source tree use it all, after which every later pattern - `apps/*`,
    // say - silently expanded to nothing and its install was never found.
    const budget: Budget = { left: scanLimit, exhausted: false };
    for (const dir of expand(root, pattern.split("/"), budget)) (negated ? exclude : include).add(dir);
    if (budget.exhausted) truncated.push(raw);
  }
  const packages = [...include].filter((dir) => !exclude.has(dir) && existsSync(join(dir, "package.json")));
  return { packages, truncated };
}

function workspacePatterns(root: string): string[] {
  const patterns: string[] = [];
  const workspaces = readJson(join(root, "package.json"))?.workspaces;
  if (Array.isArray(workspaces)) patterns.push(...workspaces.filter(isString));
  else if (isObject(workspaces) && Array.isArray(workspaces.packages)) {
    patterns.push(...workspaces.packages.filter(isString));
  }
  const pnpm = join(root, "pnpm-workspace.yaml");
  if (existsSync(pnpm)) patterns.push(...pnpmPackages(readFileSync(pnpm, "utf8")));
  return patterns;
}

/**
 * Only the `packages:` list of pnpm-workspace.yaml, in the shapes people write it:
 * a block sequence, indented under the key or level with it, with or without
 * trailing comments; or a flow sequence, on one line or several. A YAML parser
 * would be a new dependency installed for every user of this server, to read
 * one list of strings.
 */
function pnpmPackages(source: string): string[] {
  const lines = source.split(/\r?\n/);
  const at = lines.findIndex((line) => /^packages\s*:/.test(line));
  if (at === -1) return [];
  const rest = lines[at]!.replace(/^packages\s*:/, "").trim();
  if (rest.startsWith("[")) {
    let flow = rest;
    for (let next = at + 1; !flow.includes("]") && next < lines.length; next++) flow += ` ${lines[next]}`;
    const inner = /\[([^\]]*)\]/.exec(flow)?.[1] ?? "";
    return inner.split(",").map(yamlScalar).filter(Boolean);
  }
  const items: string[] = [];
  for (const line of lines.slice(at + 1)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (!item) break; // the next key
    items.push(yamlScalar(item[1]!));
  }
  return items.filter(Boolean);
}

/** A string as written in that list: quoted, or bare with an optional trailing comment. */
function yamlScalar(raw: string): string {
  const value = raw.trim();
  const quote = value[0];
  if (quote === '"' || quote === "'") {
    const end = value.indexOf(quote, 1);
    return end === -1 ? value.slice(1) : value.slice(1, end);
  }
  return value.replace(/\s+#.*$/, "").trim();
}

/**
 * Directories one workspace pattern may scan. Only directories count - a file
 * cannot contain a package - so this bounds a `**` over a very large tree
 * without a package's source files using it up.
 */
const SCAN_LIMIT = 20_000;

interface Budget {
  left: number;
  exhausted: boolean;
}

function expand(base: string, segments: string[], budget: Budget): string[] {
  const [head, ...rest] = segments;
  if (head === undefined) return [base];
  if (head === "**") {
    // Zero or more directory levels.
    const found = expand(base, rest, budget);
    for (const child of subdirectories(base, budget)) found.push(...expand(child, segments, budget));
    return found;
  }
  if (head.includes("*")) {
    const matcher = new RegExp(`^${head.split("*").map(escapeForRegExp).join("[^/]*")}$`);
    return subdirectories(base, budget)
      .filter((dir) => matcher.test(basename(dir)))
      .flatMap((dir) => expand(dir, rest, budget));
  }
  const next = join(base, head);
  return existsSync(next) ? expand(next, rest, budget) : [];
}

function subdirectories(dir: string, budget: Budget): string[] {
  if (budget.exhausted) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    if (budget.left <= 0) {
      budget.exhausted = true;
      break;
    }
    budget.left--;
    found.push(join(dir, entry.name));
  }
  return found;
}

function dependsOnFuji(dir: string): boolean {
  const manifest = readJson(join(dir, "package.json"));
  return ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].some((field) => {
    const dependencies = manifest?.[field];
    return isObject(dependencies) && "@fujiui/react" in dependencies;
  });
}

function projectUsesFuji(dir: string, scanLimit: number): boolean {
  return dependsOnFuji(dir) || workspacePackages(dir, scanLimit).packages.some(dependsOnFuji);
}

function usesPlugAndPlay(dir: string): boolean {
  return existsSync(join(dir, ".pnp.cjs")) || existsSync(join(dir, ".pnp.js"));
}

function installedVersion(root: string): string {
  const version = readJson(join(root, "package.json"))?.version;
  return typeof version === "string" ? version : "unknown";
}

function readJson(path: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    return isObject(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

const isString = (value: unknown): value is string => typeof value === "string";
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function readRegistry(path: string): Registry {
  let registry: Registry;
  try {
    registry = JSON.parse(readFileSync(path, "utf8")) as Registry;
  } catch (cause) {
    // A build interrupted mid-write leaves a truncated file. Say which file,
    // rather than surfacing a bare `SyntaxError` with no path in it.
    throw new Error(`Registry at ${path} is not valid JSON: ${(cause as Error).message}`);
  }
  // Only a LOWER version is fatal - that registry predates fields this server
  // reads. A higher one is additive by construction (the schema only ever
  // gains fields within a major), so refusing it would brick every installed
  // server the moment the library shipped one, which is the opposite of what
  // a version check is for.
  // `undefined < 1` and `"1" < 1` are both false, so a registry predating the
  // field - exactly what this check exists to reject - used to sail through.
  if (typeof registry?.schemaVersion !== "number") {
    throw new Error(
      `Registry at ${path} has no numeric schemaVersion. It is either not a Fuji registry, or predates the field.`,
    );
  }
  if (registry.schemaVersion < SCHEMA_VERSION) {
    throw new Error(
      `Registry at ${path} is schema version ${registry.schemaVersion}; ` +
        `this server needs ${SCHEMA_VERSION} or later. Update @fujiui/react.`,
    );
  }
  // Shape, not just version. Every tool reads these; without the check a JSON
  // file that merely parses got past `loadRegistry` and then threw a raw zod
  // stack at module scope, which the client reports only as "server failed to
  // start" - the outcome the friendly errors here exist to avoid.
  for (const [field, ok] of [
    ["categories", Array.isArray(registry.categories)],
    ["components", Array.isArray(registry.components)],
    ["index", Array.isArray(registry.index)],
    ["conventions", Array.isArray(registry.conventions)],
    ["exports.values", Array.isArray(registry.exports?.values)],
    ["package.name", typeof registry.package?.name === "string"],
  ] as const) {
    if (!ok) throw new Error(`Registry at ${path} is missing or malformed: ${field}.`);
  }
  return registry;
}
