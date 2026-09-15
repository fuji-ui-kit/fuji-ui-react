#!/usr/bin/env node
/**
 * MCP server for `@fujiui/react`.
 *
 * Thin by design: every fact comes from the registry the library generates at
 * build time, so the answers match the version the caller actually builds
 * against and cannot drift from it. All the logic here is about SHAPE - what to
 * return, and how little of it - because a tool result is spent from the
 * caller's context window on every turn.
 *
 * Three tools, deliberately. Each schema costs context whether or not it is
 * called, and these three cover the questions that come up: what exists, how do
 * I use this one, and is what I wrote correct.
 */
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadRegistry, type Component, type LoadedRegistry } from "./registry.js";
import { reviewUsage, editDistance } from "./review.js";

// Both spellings. `--registry=path` is the conventional form in an MCP client's
// `args` array, and the index-plus-one reading ignored it silently - answering
// every question from an auto-discovered registry while the caller believed
// they had chosen one. A flag with no value, or one followed by another flag,
// is an error for the same reason.
function flag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const equals = process.argv.find((arg) => arg.startsWith(prefix));
  if (equals) return equals.slice(prefix.length) || fail(`--${name}= was given no path.`);
  const at = process.argv.indexOf(`--${name}`);
  if (at === -1) return undefined;
  const next = process.argv[at + 1];
  if (!next || next.startsWith("-")) return fail(`--${name} was given no path.`);
  return next;
}

function fail(message: string): never {
  console.error(message);
  return process.exit(1);
}

const options = { registryPath: flag("registry"), projectDir: flag("project") };

// One source of truth for the version. npm always ships package.json, and this
// file is `dist/index.js` inside the package, so `../package.json` is ours.
const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

/**
 * Where the rules `review_usage` cites are written down. Neither npm package
 * ships SPEC.md or ARCHITECTURE.md, so a bare "(SPEC.md §4)" named a file the
 * user does not have; the repository is public.
 */
const RULES_URL = "https://github.com/fuji-ui-kit/fuji-ui-react";

/**
 * The registry, or the reason there isn't one.
 *
 * The server starts either way. It used to exit when no registry could be
 * found - right for a misconfigured project, wrong for the most common install:
 * `claude mcp add --scope user` runs the server in EVERY project, most of which
 * do not use Fuji, and each of those showed a failed server whose only
 * explanation went to stderr, which the model never sees. Answering every call
 * with the reason puts it where the agent can act on it and tell the user.
 *
 * A failed lookup is retried on the next call, so installing `@fujiui/react` -
 * or upgrading it from a release that predates registry.json - starts working
 * without a restart. A successful lookup is kept for the life of the process:
 * re-resolving, re-scanning a workspace and re-parsing a ~350 KB registry on
 * every call would cost more than it saves, so after upgrading an install this
 * server has already read, the answers update in a new session.
 */
let loaded: LoadedRegistry | undefined;
function current(): LoadedRegistry | string {
  if (loaded) return loaded;
  try {
    loaded = loadRegistry(options);
    return loaded;
  } catch (error) {
    return (error as Error).message;
  }
}

const initial = current();

/**
 * Sent to the client on connect. Claude Code passes server instructions to the
 * model, so this is how an agent learns the intended workflow without the user
 * writing it into CLAUDE.md or AGENTS.md. Kept short: it is spent from the
 * caller's context in every session, used or not.
 */
const INSTRUCTIONS = [
  "Answers questions about @fujiui/react from the version installed in this project.",
  "Before using a Fuji component you have not used yet in this session, call get_component for it instead of guessing props or allowed values.",
  "To find a component, call list_components with a query or a category; an unfiltered listing is the whole library.",
  "When adding Fuji to an app, call get_component for FujiProvider first: it includes the setup steps.",
  "After writing or editing code that imports @fujiui/react, call review_usage on it and fix every finding before finishing.",
  "theme, material, radius and elevation are set once on FujiProvider, never on individual components.",
].join(" ");

/**
 * All three tools only read the registry and the code they are handed. Declared
 * because the Claude Connectors Directory, and any client that decides what to
 * auto-approve from these hints, requires every tool to say so.
 */
const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

/** Findings past this point repeat themselves; the count still reports honestly. */
const MAX_FINDINGS = 25;

const server = new McpServer({ name: "fuji-ui", version }, { instructions: INSTRUCTIONS });

/** Compact text beats JSON here: it costs roughly a third as many tokens. */
function renderComponent(component: Component, state: LoadedRegistry) {
  const out: string[] = [];
  out.push(`# ${component.name}${component.title !== component.name ? ` (${component.title})` : ""}`);
  out.push(component.summary);
  out.push("");
  out.push(component.import);
  out.push(
    component.clientComponent
      ? '"use client" - a Client Component. A Server Component may render it, but cannot pass it a handler.'
      : "A Server Component. Safe to pass as a component reference across the RSC boundary.",
  );

  if (component.props.length) {
    out.push("", "## Props");
    for (const prop of component.props) {
      const type = prop.values?.length ? prop.values.map((v) => `"${v}"`).join(" | ") : prop.type;
      const bits = [`- \`${prop.name}${prop.required ? "" : "?"}: ${type}\``];
      if (prop.default !== undefined) bits.push(`(default ${prop.default})`);
      if (prop.deprecated) bits.push("**deprecated**");
      out.push(bits.join(" "));
      if (prop.description) out.push(`  ${firstParagraph(prop.description)}`);
    }
  }
  if (component.extends) out.push("", `Also accepts everything from \`${component.extends}\`.`);

  if (component.parts?.items.length) {
    out.push("", "## Parts");
    if (!component.parts.rootRenderable) {
      out.push(`\`${component.name}\` is a namespace, not a renderable element - use its parts.`);
    }
    for (const part of component.parts.items) {
      const named = part.namedExport ? ` or \`${part.namedExport}\`` : "";
      out.push(`- \`${part.dotAccess}\`${named}${part.props.length ? ` - ${propLine(part.props)}` : ""}`);
    }
    out.push(
      "",
      "In a Server Component use the named form: a static property read does not survive the client-module boundary.",
    );
  }

  if (component.examples.length) {
    out.push("", "## Examples");
    for (const example of component.examples) {
      out.push("", `### ${example.title}`);
      if (example.description) out.push(example.description);
      out.push("```tsx", example.code, "```");
    }
  }

  if (component.name === "FujiProvider") out.push(...renderSetup(state));
  return out.join("\n");
}

interface SetupGuide {
  name: string;
  install?: string;
  steps?: string[];
  code?: string;
  gotchas?: string[];
  guide?: string;
}

function isSetupGuide(value: unknown): value is SetupGuide {
  return (
    typeof value === "object" && value !== null && typeof (value as { name?: unknown }).name === "string"
  );
}

/**
 * The per-framework setup the registry carries, attached to FujiProvider because
 * that is the component every adopting app starts from. No tool returned it
 * before, so an agent adding Fuji to an existing app could learn every prop on
 * the provider and still miss the stylesheet import - after which every
 * component renders unstyled, with no error. Not a fourth tool: a schema costs
 * context in every session, and this is needed once per app.
 */
function renderSetup(state: LoadedRegistry): string[] {
  const guides = Object.values(state.registry.setup ?? {}).filter(isSetupGuide);
  if (!guides.length) return [];
  const docs = state.packageRoot ?? "node_modules/@fujiui/react";
  const out = [
    "",
    "## Setting Fuji up in an app",
    "Once per app. Without the stylesheet import every component renders unstyled, with no error.",
  ];
  for (const guide of guides) {
    out.push("", `### ${guide.name}`);
    if (guide.install) out.push(`Install: \`${guide.install}\` (in a monorepo, in the app's own package)`);
    (guide.steps ?? []).forEach((step, index) => out.push(`${index + 1}. ${step}`));
    if (guide.code) out.push("```tsx", guide.code, "```");
    for (const gotcha of guide.gotchas ?? []) out.push(`- ${gotcha}`);
    if (guide.guide) out.push(`Full guide: ${docs}/${guide.guide}`);
  }
  return out;
}

function propLine(props: Component["props"]) {
  return props
    .map(
      (p) =>
        `${p.name}${p.required ? "" : "?"}: ${p.values?.length ? p.values.map((v) => `"${v}"`).join("|") : p.type}`,
    )
    .join(", ");
}

function firstParagraph(text: string) {
  return text
    .split(/\n\s*\n/)[0]!
    .replace(/\s+/g, " ")
    .trim();
}

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

// A registry found at startup puts the real category names in the schema, where
// the agent sees them before calling. Without one the schema cannot name them,
// so the handler checks instead.
const categorySchema: z.ZodType<string> =
  typeof initial === "string"
    ? z.string().max(64)
    : z.enum(initial.registry.categories as [string, ...string[]]);

server.registerTool(
  "list_components",
  {
    title: "List Fuji components",
    description:
      "The catalogue of @fujiui/react components: name, category and a one-line summary. " +
      "Filter by category or a search term - an unfiltered listing is the whole library and is rarely what you want.",
    inputSchema: {
      category: categorySchema.optional(),
      // Bounded like the other two tools' inputs. The value is only ever used
      // for a lowercased substring match (no regex), so an unbounded string was
      // never a risk - this is consistency, not a fix.
      query: z.string().max(200).optional().describe("Matches name, summary and keywords."),
    },
    annotations: READ_ONLY,
  },
  async ({ category, query }) => {
    const state = current();
    if (typeof state === "string") return text(state);
    const { registry } = state;
    if (category && !registry.categories.includes(category)) {
      return text(`Unknown category "${category}". Categories: ${registry.categories.join(", ")}.`);
    }
    // Reads `index`, never `components`: the full component array costs ~47k
    // tokens against ~3.8k here, and answers the same question.
    let rows = registry.index;
    if (category) rows = rows.filter((row) => row.category === category);
    if (query) {
      const needle = query.toLowerCase();
      const full = new Map(registry.components.map((c) => [c.name, c]));
      rows = rows.filter((row) => {
        const component = full.get(row.name);
        return (
          row.name.toLowerCase().includes(needle) ||
          row.summary.toLowerCase().includes(needle) ||
          (component?.keywords ?? []).some((word) => word.toLowerCase().includes(needle))
        );
      });
    }
    if (!rows.length) return text(`No components match. Categories: ${registry.categories.join(", ")}.`);
    const byCategory = new Map<string, typeof rows>();
    for (const row of rows) byCategory.set(row.category, [...(byCategory.get(row.category) ?? []), row]);
    const out = [
      `${rows.length} of ${registry.index.length} components in ${registry.package.name}@${registry.package.version}.`,
    ];
    for (const [name, group] of byCategory) {
      out.push("", `## ${name}`);
      for (const row of group) out.push(`- **${row.name}** - ${row.summary}`);
    }
    return text(out.join("\n"));
  },
);

server.registerTool(
  "get_component",
  {
    title: "Get a Fuji component's API",
    description:
      "Everything needed to write correct code for one component: its import line, every prop with type, " +
      "allowed values and default, whether it is a Client Component, its compound parts in both access forms, and worked examples. " +
      "For FujiProvider it also returns the steps to set Fuji up in an app.",
    // Capped: an unbounded name feeds `editDistance`, which allocates an
    // n x m matrix against every component name in the registry.
    inputSchema: {
      name: z.string().max(128).describe('Export name, e.g. "Button" or "DialogContent".'),
    },
    annotations: READ_ONLY,
  },
  async ({ name }) => {
    const state = current();
    if (typeof state === "string") return text(state);
    const { registry } = state;
    const wanted = name.toLowerCase();
    const component =
      registry.components.find((c) => c.name.toLowerCase() === wanted) ??
      registry.components.find((c) => c.slug === wanted);
    if (component) return text(renderComponent(component, state));

    // A sub-part is a legitimate thing to ask about; answer with its owner.
    for (const candidate of registry.components) {
      const part = candidate.parts?.items.find(
        (item) => item.namedExport?.toLowerCase() === wanted || item.name.toLowerCase() === wanted,
      );
      if (part) return text(renderComponent(candidate, state));
    }
    // Substring matching fails on the case that matters - a near-miss typo
    // shares no run of four characters with the real name ("Buton"/"Button").
    const near = registry.index
      .map((row) => ({ name: row.name, score: editDistance(name.toLowerCase(), row.name.toLowerCase()) }))
      .filter((row) => row.score <= Math.max(2, Math.round(name.length / 3)))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((row) => row.name);
    return text(
      `No component named "${name}".` +
        (near.length ? ` Did you mean: ${near.join(", ")}?` : " Use list_components."),
    );
  },
);

server.registerTool(
  "review_usage",
  {
    title: "Review Fuji usage",
    description:
      "Checks code against @fujiui/react's locked conventions - subpath imports, per-component theme props, " +
      "string icon names, runtime-built Tailwind classes, unnamed icon-only controls, dot-access sub-parts in a " +
      "Server Component, and invalid prop values. Run it on anything you write against this library.",
    inputSchema: {
      // Capped. Findings are ~4 lines each and the input was unbounded, so one
      // call on a large file could return more tokens than the caller's whole
      // context window - the opposite of what this server is shaped for.
      code: z.string().max(64_000).describe("The TSX to check. A fragment is fine. Up to ~64k characters."),
    },
    annotations: READ_ONLY,
  },
  async ({ code }) => {
    const state = current();
    if (typeof state === "string") return text(state);
    const findings = reviewUsage(code, state.registry);
    if (!findings.length) {
      return text("No convention violations found.");
    }
    const shown = findings.slice(0, MAX_FINDINGS);
    const out = [`${findings.length} issue${findings.length === 1 ? "" : "s"}:`];
    for (const finding of shown) {
      out.push(
        "",
        `**Line ${finding.line}** - ${finding.problem}`,
        `Fix: ${finding.fix}`,
        `(${finding.source})`,
      );
    }
    if (findings.length > shown.length) {
      out.push(
        "",
        `…and ${findings.length - shown.length} more. Fix these first and re-run - ` +
          `one cause usually accounts for many of them.`,
      );
    }
    out.push("", `Cited files are in ${RULES_URL}.`);
    return text(out.join("\n"));
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr, not stdout: stdout is the protocol channel.
console.error(
  typeof initial === "string"
    ? `fuji-ui MCP started without a registry; every tool answers with this until it is fixed:\n${initial}`
    : `fuji-ui MCP ready - ${initial.registry.package.name}@${initial.registry.package.version} from ${initial.origin}`,
);
