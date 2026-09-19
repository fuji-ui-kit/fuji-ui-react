#!/usr/bin/env node
/**
 * MCP server for `@fujiui/react`. Every fact comes from the installed version's registry; the logic
 * is about returning as little as possible, since results and each tool schema cost caller context.
 */
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadRegistry, type AppearanceRecipe, type Component, type LoadedRegistry } from "./registry.js";
import { reviewUsage, editDistance } from "./review.js";

// Accepts `--flag value` and `--flag=value` (conventional in MCP `args`). A missing value is an
// error, never a silent fall-back to auto-discovery.
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

// This file is `dist/index.js`, so `../package.json` is ours; npm always ships it.
const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

/** Where `review_usage`'s cited SPEC.md/ARCHITECTURE.md live - neither npm package ships them. */
const RULES_URL = "https://github.com/fuji-ui-kit/fuji-ui-react";

/**
 * The registry, or the reason there isn't one, answered from every tool (stderr never reaches the
 * model). Failures retry per call; success is cached (re-parsing ~350 KB per call isn't worth it).
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
 * Passed to the model on connect, teaching the workflow without CLAUDE.md edits. Kept short: it
 * costs context in every session, used or not.
 */
const INSTRUCTIONS = [
  "Answers questions about @fujiui/react from the version installed in this project.",
  "Before using a Fuji component you have not used yet in this session, call get_component for it instead of guessing props or allowed values.",
  "To find a component, call list_components with a query or a category; an unfiltered listing is the whole library.",
  "When adding Fuji to an app, call get_component for FujiProvider first: it includes the setup steps.",
  "After writing or editing code that imports @fujiui/react, call review_usage on it and fix every finding before finishing.",
  "theme, material, radius and elevation are set once on FujiProvider, never on individual components.",
  "For dark mode, a theme toggle, following the OS, remembering the choice, glass, or styling your own markup so it follows the theme, call get_appearance before writing code.",
].join(" ");

/** All tools are read-only; the Connectors Directory and auto-approving clients require the hint. */
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
 * Per-framework setup, attached to FujiProvider so agents don't miss the stylesheet import. Not a
 * fourth tool: a schema costs context every session, and this is needed once per app.
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

// With a registry at startup the schema names the real categories; otherwise the handler checks.
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
      // Bounded for consistency with the other tools; it's only a substring match.
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
    // Reads `index`, not `components`: ~3.8k tokens instead of ~47k for the same answer.
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
    // Capped: the name feeds `editDistance`, an n x m matrix per component name.
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
    // Edit distance, not substrings, so typos like "Buton" still match.
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
      // Capped: findings are ~4 lines each, so a huge file could overflow the caller's context.
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

/** Recipe ids, for the schema and for "unknown topic" answers. */
const TOPICS = ["page", "toggle", "system", "persist", "glass", "own-markup", "tokens"] as const;

function renderRecipe(recipe: AppearanceRecipe, state: LoadedRegistry) {
  const docs = state.packageRoot ?? "node_modules/@fujiui/react";
  const out = [`# ${recipe.title}`, recipe.summary];
  (recipe.steps ?? []).forEach((step, index) => out.push(`${index + 1}. ${step}`));
  if (recipe.code) out.push("```tsx", recipe.code, "```");
  for (const gotcha of recipe.gotchas ?? []) out.push(`- ${gotcha}`);
  if (recipe.guide) out.push(`Full guide: ${docs}/${recipe.guide}`);
  return out.join("\n");
}

/** One token group with each scope's value - the whole set is ~5k tokens, a group 90-2.2k. */
function renderTokenGroup(group: string, state: LoadedRegistry) {
  const { tokens } = state.registry;
  const names = tokens.groups[group];
  if (!names) return `Unknown token group "${group}". Groups: ${Object.keys(tokens.groups).join(", ")}.`;
  const out = [`# ${group} tokens`, "Scope: root (defaults), then each theme/material the value changes in."];
  for (const name of names) {
    const entry = tokens.values[name] as { scopes?: Record<string, string> } | undefined;
    const scopes = Object.entries(entry?.scopes ?? {})
      .map(([scope, value]) => `${scope}: ${value}`)
      .join(" | ");
    out.push(`- \`${name}\`${scopes ? ` - ${scopes}` : ""}`);
  }
  return out.join("\n");
}

server.registerTool(
  "get_appearance",
  {
    title: "Get Fuji appearance recipes",
    description:
      "How to do dark mode and glass right with @fujiui/react: fill the page (page), a light/dark toggle (toggle), " +
      "follow the OS (system), remember the choice without a flash (persist), glass (glass), make your own " +
      "markup follow the theme incl. Tailwind's dark: variant (own-markup), and design tokens (tokens, with an " +
      "optional group). Omit topic for the list.",
    inputSchema: {
      topic: z.enum(TOPICS).optional(),
      group: z
        .string()
        .max(32)
        .optional()
        .describe('With topic "tokens": one group, e.g. "color", "glass", "radius", "spacing".'),
    },
    annotations: READ_ONLY,
  },
  async ({ topic, group }) => {
    const state = current();
    if (typeof state === "string") return text(state);
    const recipes = state.registry.appearance;
    if (!recipes?.length) {
      return text(
        `${state.registry.package.name}@${state.registry.package.version} predates the appearance recipes. ` +
          `Read ${state.packageRoot ?? "node_modules/@fujiui/react"}/docs/theming.md, or upgrade the package.`,
      );
    }
    if (topic === "tokens" && group) return text(renderTokenGroup(group, state));
    if (topic) {
      const recipe = recipes.find((entry) => entry.id === topic);
      if (recipe) {
        const extra =
          topic === "tokens" ? `\n\nGroups: ${Object.keys(state.registry.tokens.groups).join(", ")}.` : "";
        return text(renderRecipe(recipe, state) + extra);
      }
    }
    return text(
      [
        "Appearance recipes - call get_appearance with one topic:",
        ...recipes.map((recipe) => `- **${recipe.id}** - ${recipe.summary}`),
      ].join("\n"),
    );
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
