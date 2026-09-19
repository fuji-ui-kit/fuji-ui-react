#!/usr/bin/env node
// Generates `dist/registry.json` for agents, the MCP server and the docs site: categories, compound
// parts, "use client", tokens and examples on top of props. Props are read from `dist/props.json`,
// never re-derived (two generators would drift), so `build:props` runs first. Hand-authored input
// lives in `registry/`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import postcss from "postcss";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");
const REGISTRY = path.join(ROOT, "registry");

const propsPath = path.join(DIST, "props.json");
if (!fs.existsSync(propsPath)) {
  console.error("dist/props.json not found - run `npm run build:props` first.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const PROPS = JSON.parse(fs.readFileSync(propsPath, "utf8"));
const metadata = JSON.parse(fs.readFileSync(path.join(REGISTRY, "metadata.json"), "utf8"));
const conventions = JSON.parse(fs.readFileSync(path.join(REGISTRY, "conventions.json"), "utf8"));
const setup = JSON.parse(fs.readFileSync(path.join(REGISTRY, "setup.json"), "utf8"));
const appearance = JSON.parse(fs.readFileSync(path.join(REGISTRY, "appearance.json"), "utf8"));

const errors = [];
const warnings = [];

// ---------------------------------------------------------------------------
// Source parsing
// ---------------------------------------------------------------------------

/**
 * Syntactic only (never `createProgram`): a full program loads the React + Base UI type graph,
 * costing seconds per build, and authored type text reads better than `typeToString`.
 */
function sourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) out.push(full);
  }
  return out;
}

function resolveSpecifier(fromFile, spec) {
  const base = path.join(path.dirname(fromFile), spec);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * The public export set walked from `src/index.ts`; the authority `dist/index.d.ts` is checked
 * against. Returns name -> declaring file, the join key for everything else.
 */
function collectExports(entry, seen = new Set(), out = new Map()) {
  if (seen.has(entry)) return out;
  seen.add(entry);
  const source = sourceFile(entry);
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      const spec = statement.moduleSpecifier?.text;
      const target = spec ? resolveSpecifier(entry, spec) : null;
      if (!statement.exportClause) {
        if (target) collectExports(target, seen, out);
        continue;
      }
      if (!ts.isNamedExports(statement.exportClause)) continue;
      for (const element of statement.exportClause.elements) {
        const name = element.name.text;
        const isType = statement.isTypeOnly || element.isTypeOnly;
        // Resolve to the declaring file, not the forwarding barrel. A FRESH `seen` per element:
        // sharing it made later names in `export { A, B }` fall through to the barrel, which
        // `source` and `clientComponent` are then read from.
        const declared = target ? collectExports(target, new Set(), new Map()).get(name) : undefined;
        out.set(name, { file: declared?.file ?? target ?? entry, isType });
      }
      continue;
    }
    const exported = ts.getModifiers?.(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    const isType = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        out.set(declaration.name.getText(source), { file: entry, isType: false });
      }
    } else if (statement.name) {
      out.set(statement.name.getText(source), { file: entry, isType });
    }
  }
  return out;
}

/**
 * Exported types, literal unions resolved to `values`: otherwise `size: ComponentSize` hides
 * `"sm" | "md" | "lg"` and agents guess `"medium"` (aliases cover ~70 props).
 */
function collectTypes(publicNames) {
  const types = {};
  for (const file of walk(SRC)) {
    const source = sourceFile(file);
    for (const statement of source.statements) {
      const isAlias = ts.isTypeAliasDeclaration(statement);
      // Interfaces too: ~20 item shapes (`SelectItem`, `DataTableColumn`, `TreeNode`) back required
      // props, and without them a consumer has to invent the fields.
      const isInterface = ts.isInterfaceDeclaration(statement) && !/Props$/.test(statement.name.text);
      if (!isAlias && !isInterface) continue;
      const exported = ts.getModifiers?.(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      const name = statement.name.text;
      if (types[name]) continue;
      // A module-level `export` is not a package export; internal types must not be advertised.
      if (!publicNames.has(name)) continue;
      if (isAlias) {
        types[name] = { type: statement.type.getText(source).replace(/\s+/g, " ") };
        const values = literalUnion(statement.type);
        if (values) types[name].values = values;
      } else {
        const heritage = statement.heritageClauses
          ?.flatMap((clause) => clause.types.map((entry) => entry.getText(source)))
          .join(", ");
        types[name] = {
          type: "interface",
          // Without type params `Row` in `DataTableColumn` reads as a real type; without heritage
          // an extending interface shows only its own members.
          typeParameters: statement.typeParameters?.map((p) => p.getText(source)),
          extends: heritage || undefined,
          fields: statement.members.filter(ts.isPropertySignature).map((member) => ({
            name: member.name.getText(source),
            type: (member.type?.getText(source) ?? "unknown").replace(/\s+/g, " "),
            required: !member.questionToken,
          })),
        };
      }
    }
  }
  // Sorted: readdir order varies by filesystem, and the artifact must be byte-reproducible.
  return Object.fromEntries(
    Object.keys(types)
      .sort()
      .map((key) => [key, types[key]]),
  );
}

/** `"sm" | "md" | "lg"` -> ["sm","md","lg"]; anything else -> null. */
function literalUnion(node) {
  const members = ts.isUnionTypeNode(node) ? node.types : [node];
  const values = [];
  for (const member of members) {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) return null;
    values.push(member.literal.text);
  }
  return values.length > 1 ? values : null;
}

/** The same, read from the type TEXT, for a union written inline on the prop. */
function literalUnionFromText(text) {
  const parts = text.split("|").map((part) => part.trim());
  if (parts.length < 2) return null;
  const values = [];
  for (const part of parts) {
    const match = /^"([^"]*)"$/.exec(part);
    if (!match) return null;
    values.push(match[1]);
  }
  return values;
}

/**
 * Inherited props source for components with no `*Props` type (mostly parts wrapping a Base UI
 * primitive), which would otherwise read as "takes no props".
 */
function collectInlinePropsTypes() {
  const byComponent = new Map();
  for (const file of walk(SRC)) {
    const source = sourceFile(file);
    // Resolve per-file aliases like `Base` to their module, or ten components publish the same
    // unresolvable `typeof Base.Root`.
    const imports = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
      const from = statement.moduleSpecifier.getText(source).slice(1, -1);
      const named = statement.importClause.namedBindings;
      if (named && ts.isNamespaceImport(named)) imports.set(named.name.text, `import("${from}")`);
      if (statement.importClause.name) {
        imports.set(statement.importClause.name.text, `import("${from}").default`);
      }
      // The form this codebase uses: `import { Dialog as Base } from "@base-ui/react/dialog"`.
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          const imported = (element.propertyName ?? element.name).text;
          imports.set(element.name.text, `import("${from}").${imported}`);
        }
      }
    }
    const resolve = (text) =>
      text.replace(/\btypeof ([A-Z]\w*)\b/g, (whole, alias) =>
        imports.has(alias) ? `typeof ${imports.get(alias)}` : whole,
      );
    const visit = (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        /forwardRef$/.test(node.initializer.expression.getText(source)) &&
        node.initializer.typeArguments?.length === 2
      ) {
        const text = resolve(node.initializer.typeArguments[1].getText(source).replace(/\s+/g, " "));
        // A named `*Props` type is already covered by props.json.
        if (!/^\w+Props$/.test(text)) byComponent.set(node.name.text, text);
      }
      // A part re-exported straight from Base UI (`TooltipTrigger = Base.Trigger`): its whole API
      // is the primitive's.
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isPropertyAccessExpression(node.initializer) &&
        /^[A-Z]/.test(node.name.text) &&
        !byComponent.has(node.name.text)
      ) {
        byComponent.set(
          node.name.text,
          resolve(`React.ComponentPropsWithoutRef<typeof ${node.initializer.getText(source)}>`),
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return byComponent;
}

/**
 * Compound shapes: `Object.assign(Root, {...})` (root renderable) and plain object literals like
 * `Collapsible` (not renderable), distinguished by `rootRenderable`.
 */
function collectCompounds() {
  const compounds = new Map();
  for (const file of walk(SRC)) {
    const source = sourceFile(file);
    const visit = (node) => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        const init = node.initializer;
        if (
          ts.isCallExpression(init) &&
          init.expression.getText(source) === "Object.assign" &&
          init.arguments.length === 2 &&
          ts.isObjectLiteralExpression(init.arguments[1])
        ) {
          compounds.set(name, {
            rootRenderable: true,
            // `Dialog` is the export, but the props live on `DialogRoot`.
            root: init.arguments[0].getText(source),
            parts: partsOf(init.arguments[1], source),
            file,
          });
        } else if (ts.isObjectLiteralExpression(init) && /^[A-Z]/.test(name)) {
          const parts = partsOf(init, source);
          // Every value must look like a component, or it's a config object.
          if (parts.length >= 2 && parts.every((part) => /^[A-Z]/.test(part.implementation))) {
            compounds.set(name, { rootRenderable: false, parts, file });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return compounds;
}

function partsOf(objectLiteral, source) {
  const parts = [];
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      parts.push({
        name: property.name.getText(source),
        implementation: property.initializer.getText(source),
      });
    } else if (ts.isShorthandPropertyAssignment(property)) {
      parts.push({ name: property.name.text, implementation: property.name.text });
    }
  }
  return parts;
}

/**
 * The exact predicate `tsup.config.ts` uses, so registry and build never disagree. An AST
 * directive check would accept a file the build silently drops.
 */
function isClientComponent(file) {
  return fs.readFileSync(file, "utf8").startsWith('"use client";');
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/**
 * `[data-fuji-theme="dark"][data-fuji-elevation="floating"]` -> `dark+elevation:floating`;
 * `[data-fuji-material="glass"][data-fuji-theme="light"]` -> `glass+light`. Theme and material
 * values are unambiguous, so they carry no axis prefix. `material` replaced `glass` in the
 * theme/material split; matching the old attribute dropped every glass value from the registry.
 */
function scopeOf(selector) {
  if (selector === ":root") return "root";
  const parts = [];
  for (const [, axis, value] of selector.matchAll(
    /\[data-fuji-(theme|material|radius|elevation)="([^"]+)"\]/g,
  )) {
    parts.push(axis === "theme" || axis === "material" ? value : `${axis}:${value}`);
  }
  return parts.length ? parts.join("+") : null;
}

/**
 * Token groups, so a consumer can ask for colors alone: all 99 tokens in one response cost
 * several thousand tokens of agent context.
 */
const TOKEN_GROUPS = [
  [/^--fuji-(space|panel-p|control-p)/, "spacing"],
  [/^--fuji-(text|font|leading|tracking)/, "typography"],
  [/^--fuji-radius/, "radius"],
  [/^--fuji-shadow/, "elevation"],
  [/^--fuji-(duration|ease|stagger)/, "motion"],
  [/^--fuji-backdrop/, "glass"],
];

function groupOf(name) {
  for (const [pattern, group] of TOKEN_GROUPS) if (pattern.test(name)) return group;
  // Everything left is a paint: surfaces, foregrounds, borders, tones, fills.
  return "color";
}

function collectTokens() {
  const file = path.join(SRC, "styles", "tokens.css");
  const root = postcss.parse(fs.readFileSync(file, "utf8"));
  const values = {};
  const notes = [];
  root.walkRules((rule) => {
    // `@media`/`@supports` fallbacks are summarised, not merged, which would overwrite real values.
    if (rule.parent?.type === "atrule") {
      const { name, params } = rule.parent;
      if (name === "media" || name === "supports") {
        const at = `@${name} ${params}`;
        if (!notes.includes(at)) notes.push(at);
      }
      return;
    }
    const scope = scopeOf(rule.selector);
    if (!scope) return;
    rule.walkDecls(/^--fuji-/, (decl) => {
      values[decl.prop] ??= { group: groupOf(decl.prop), scopes: {} };
      values[decl.prop].scopes[scope] = decl.value.replace(/\s+/g, " ").trim();
    });
  });
  const groups = {};
  for (const [name, token] of Object.entries(values)) (groups[token.group] ??= []).push(name);
  return {
    notes: notes.map((at) => `${at} restates some tokens; not represented here.`),
    groups,
    values,
  };
}

// ---------------------------------------------------------------------------
// Guides and examples
// ---------------------------------------------------------------------------

function collectGuides() {
  const dir = path.join(ROOT, "docs");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const text = fs.readFileSync(path.join(dir, name), "utf8");
      const lines = text.split("\n");
      const titleIndex = lines.findIndex((line) => line.startsWith("# "));
      const summary = lines.slice(titleIndex + 1).find((line) => line.trim() && !line.startsWith("#"));
      return {
        id: name.replace(/\.md$/, ""),
        title: titleIndex >= 0 ? lines[titleIndex].slice(2).trim() : name,
        summary: summary?.trim(),
        // Not inlined: `docs/` ships in the tarball, and ~90 KB of prose would load for everyone.
        path: `docs/${name}`,
        // UTF-8 bytes, not UTF-16 `text.length` - the prose has many en dashes and arrows.
        bytes: Buffer.byteLength(text, "utf8"),
      };
    });
}

/** `## Title` / prose / ```tsx fence - one example per heading. */
function parseExamples(markdown) {
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading, ...rest] = block.split("\n");
      const body = rest.join("\n");
      const fence = body.match(/```tsx\n([\s\S]*?)\n```/);
      const description = body.split("```")[0].trim();
      return { title: heading.trim(), description: description || undefined, code: fence?.[1] };
    })
    .filter((example) => example.code);
}

function collectExamples() {
  const dir = path.join(REGISTRY, "examples");
  const bySlug = new Map();
  for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith(".md"))) {
    bySlug.set(name.replace(/\.md$/, ""), parseExamples(fs.readFileSync(path.join(dir, name), "utf8")));
  }
  return bySlug;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

const exports_ = collectExports(path.join(SRC, "index.ts"));
const TYPES = collectTypes(new Set(exports_.keys()));
const INLINE_PROPS = collectInlinePropsTypes();

/**
 * Attaches allowed values to a prop, inline rather than via `types`, so a `get_component`
 * response stands alone in an agent's context for a handful of tokens.
 */
function withValues(prop) {
  const values = TYPES[prop.type]?.values ?? literalUnionFromText(prop.type);
  return values ? { ...prop, values } : prop;
}
const compounds = collectCompounds();
const examples = collectExamples();
const propsByComponent = new Map(
  Object.entries(PROPS).map(([key, table]) => [table.component, { key, table }]),
);

// Every component this package exports as a value, in the order metadata lists.
const components = [];
const seenExports = new Set();

for (const [slug, meta] of Object.entries(metadata.components)) {
  if (!metadata.categories.includes(meta.category)) {
    errors.push(`registry/metadata.json: "${slug}" has unknown category "${meta.category}"`);
  }
  const names = meta.exports ?? [
    slug
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(""),
  ];
  for (const name of names) {
    const exported = exports_.get(name);
    if (!exported || exported.isType) {
      errors.push(`registry/metadata.json: "${slug}" names "${name}", which the package does not export`);
      continue;
    }
    seenExports.add(name);
    const props = propsByComponent.get(name) ?? propsByComponent.get(`${name}Root`);
    const compound = compounds.get(name);
    const relative = path.relative(ROOT, exported.file);
    const slugExamples = examples.get(slug) ?? [];
    if (!slugExamples.length) warnings.push(`no examples for "${slug}"`);

    components.push({
      name,
      // Page title, not always the export name ("Layout" documents five exports).
      title: meta.name,
      slug,
      category: meta.category,
      summary: meta.summary,
      keywords: meta.keywords ?? [],
      import: `import { ${name} } from "${pkg.name}";`,
      source: relative,
      clientComponent: isClientComponent(exported.file),
      propsType: props?.key,
      // Same fallback as parts: a root re-exporting a Base UI primitive (`DialogRoot = Base.Root`)
      // otherwise reads as "takes nothing".
      extends:
        props?.table.extends ??
        INLINE_PROPS.get(name) ??
        (compound?.root ? INLINE_PROPS.get(compound.root) : undefined),
      props: (props?.table.props ?? []).map(withValues),
      parts: compound
        ? {
            rootRenderable: compound.rootRenderable,
            items: compound.parts.map((part) => {
              const partProps = propsByComponent.get(part.implementation);
              const inherited = partProps?.table.extends ?? INLINE_PROPS.get(part.implementation);
              return {
                name: part.name,
                dotAccess: `${name}.${part.name}`,
                // Server Components must use this form (server-component-subparts convention).
                namedExport: exports_.has(part.implementation) ? part.implementation : undefined,
                propsType: partProps?.key,
                extends: inherited,
                props: (partProps?.table.props ?? []).map(withValues),
              };
            }),
          }
        : undefined,
      examples: slugExamples,
    });
  }
}

// Gates. Batched into one list and reported together, matching
// check-skill-sync.mjs, so one run tells you everything rather than one thing.
const describedParts = new Set(
  [...compounds.values()].flatMap((compound) => compound.parts.map((part) => part.implementation)),
);
const undescribed = [...exports_]
  .filter(([name, entry]) => {
    if (entry.isType || seenExports.has(name) || describedParts.has(name)) return false;
    // Hooks, lowercase helpers, props types and SCREAMING_CASE constants are not components.
    return !/^(use|[a-z])/.test(name) && !/(Props|Root|Handle)$/.test(name) && !/^[A-Z0-9_]+$/.test(name);
  })
  .map(([name]) => name);
if (undescribed.length) {
  warnings.push(
    `${undescribed.length} exported component(s) have no metadata entry: ${undescribed.join(", ")}`,
  );
}

for (const slug of examples.keys()) {
  if (!(slug in metadata.components)) errors.push(`registry/examples/${slug}.md has no metadata entry`);
}

/** A component's own props plus its sub-parts'. */
function allProps(component) {
  return [...component.props, ...(component.parts?.items ?? []).flatMap((part) => part.props)];
}

const undocumented = components.reduce(
  (total, component) => total + allProps(component).filter((prop) => !prop.description).length,
  0,
);
if (undocumented) warnings.push(`${undocumented} prop(s) have no description`);
for (const component of components) {
  // Roots too (13 once shipped with no API). A non-renderable root like `Collapsible` is exempt.
  if (component.parts?.rootRenderable !== false && !component.props.length && !component.extends) {
    warnings.push(`${component.name} describes no props and no inherited source`);
  }
  for (const part of component.parts?.items ?? []) {
    if (!part.namedExport) warnings.push(`${component.name}.${part.name} has no named export`);
    // With neither, a reader takes the entry to mean "takes no props".
    if (!part.props.length && !part.extends) {
      warnings.push(`${component.name}.${part.name} describes no props and no inherited source`);
    }
  }
}

// ---------------------------------------------------------------------------
// Export parity: the barrel walk above vs what the build actually emitted.
// Catches both a wrong walk here and a dts rollup dropping a symbol.
// ---------------------------------------------------------------------------
const dtsPath = path.join(DIST, "index.d.ts");
if (fs.existsSync(dtsPath)) {
  const declared = new Set();
  const source = sourceFile(dtsPath);
  const visit = (node) => {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) declared.add(element.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const missing = [...exports_.keys()].filter((name) => !declared.has(name));
  if (missing.length) {
    errors.push(`dist/index.d.ts is missing ${missing.length} export(s): ${missing.slice(0, 8).join(", ")}`);
  }
} else {
  warnings.push("dist/index.d.ts not found - export parity not checked");
}

// ---------------------------------------------------------------------------

const registry = {
  schemaVersion: 1,
  package: {
    name: pkg.name,
    version: pkg.version,
    import: pkg.name,
    styles: [`${pkg.name}/styles.css`, `${pkg.name}/tokens.css`],
  },
  conventions: conventions.rules,
  setup: setup.frameworks,
  // Theme, glass, persistence and token recipes - what an agent needs past the first render.
  appearance: appearance.recipes,
  categories: metadata.categories,
  // Canonical definitions, for consumers wanting the whole vocabulary (linters, completion).
  types: TYPES,
  /**
   * Every public export, by kind. `components` omits `*Root`, `*Props`, item types and hooks, so
   * checking imports against it would flag correct code - worse than not checking.
   */
  exports: {
    values: [...exports_]
      .filter(([, entry]) => !entry.isType)
      .map(([name]) => name)
      .sort(),
    types: [...exports_]
      .filter(([, entry]) => entry.isType)
      .map(([name]) => name)
      .sort(),
  },
  /**
   * Precomputed listing shape for the most-called tool: ~3.5k tokens vs ~47k for the full
   * `components` array. The duplication only costs disk bytes.
   */
  index: components.map((component) => ({
    name: component.name,
    slug: component.slug,
    category: component.category,
    summary: component.summary,
    ...(component.title !== component.name ? { title: component.title } : {}),
  })),
  components,
  tokens: collectTokens(),
  guides: collectGuides(),
  stats: {
    components: components.length,
    props: components.reduce((total, component) => total + allProps(component).length, 0),
    documentedProps: components.reduce(
      (total, component) => total + allProps(component).filter((prop) => prop.description).length,
      0,
    ),
    examples: [...examples.values()].flat().length,
    clientComponents: components.filter((component) => component.clientComponent).length,
  },
};

for (const warning of warnings) console.warn(`  warn: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`  error: ${error}`);
  console.error(`\n${errors.length} registry error(s) - not writing dist/registry.json.`);
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });
const out = path.join(DIST, "registry.json");
fs.writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(
  `Wrote ${out} (${registry.stats.components} components, ${registry.stats.props} props, ` +
    `${registry.stats.examples} examples, ${Object.keys(registry.tokens.values).length} tokens, ${kb} KB)`,
);
