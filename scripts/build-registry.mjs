#!/usr/bin/env node
// Generates `dist/registry.json`: a machine-readable description of this
// package for tools that write code against it - editor agents, the MCP
// server, and the documentation site.
//
// It is the same category of artifact as `dist/index.d.ts` and
// `dist/props.json`: generated from the source at build time, never
// hand-maintained. What it adds over `props.json` is everything a props table
// cannot express - which category a component belongs to, what it is for, its
// compound parts and whether each is reachable as a named export, whether the
// file carries "use client", the design tokens, and worked examples.
//
// Prop data is read from `dist/props.json` rather than re-derived. Two
// generators over one surface is precisely the drift this file exists to
// prevent, so `npm run build:props` must run first (the `build` script chains
// them in order).
//
// Authored input lives in `registry/` - the parts no script can derive.
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

const errors = [];
const warnings = [];

// ---------------------------------------------------------------------------
// Source parsing
// ---------------------------------------------------------------------------

/**
 * Syntactic only - `createSourceFile`, never `createProgram`. A full program
 * pulls in the whole `@types/react` + `@base-ui/react` type graph, costing
 * seconds inside every build on both CI Node versions, and the checker's
 * `typeToString` produces worse strings for an agent than the authored type
 * text does. Everything below is in the syntax.
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
 * The public export set, walked from `src/index.ts` through every `export *`
 * and re-export. This is the authority on what is public - `dist/index.d.ts`
 * is only checked against it, below.
 *
 * Returns name -> declaring file, which is the join key for everything else.
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
        // Follow the re-export so a name resolves to where it is declared,
        // not to the barrel that forwarded it.
        //
        // A FRESH `seen` per element. Sharing it meant the second and later
        // names in `export { A, B } from "./x"` hit the visited guard, got an
        // empty map back, and fell through to the barrel - which is what
        // `source` and, worse, `clientComponent` are then read from. It is live
        // today for `useFujiConfig` and `FujiProviderProps`, and only harmless
        // because the barrels happen to re-export from the implementation file.
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
 * Every exported type alias, resolved to its allowed values where it is a union
 * of literals.
 *
 * Without this a prop reads `size: ComponentSize` and stops there - an agent has
 * no way to reach `"sm" | "md" | "lg"`, so it guesses `"medium"` and the control
 * silently renders unstyled. Three of the most-used props in the package
 * (`size`, `tone`, `appearance`) are aliases, covering some seventy props in
 * all.
 *
 * Only literal unions get `values`; everything else keeps its type text, which
 * is the honest answer for `IconComponent` or `ResponsiveCount`.
 */
function collectTypes(publicNames) {
  const types = {};
  for (const file of walk(SRC)) {
    const source = sourceFile(file);
    for (const statement of source.statements) {
      const isAlias = ts.isTypeAliasDeclaration(statement);
      // Interfaces too. Skipping them left 20 exported item shapes defined
      // nowhere - `SelectItem`, `DataTableColumn`, `TreeNode`, `TimelineItem`
      // and the rest. Those are the REQUIRED props of the components that most
      // need a worked shape (`Select.items`, `DataTable.columns`, `Tree.data`),
      // so a consumer had the name, no definition, and had to invent the fields.
      const isInterface = ts.isInterfaceDeclaration(statement) && !/Props$/.test(statement.name.text);
      if (!isAlias && !isInterface) continue;
      const exported = ts.getModifiers?.(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      const name = statement.name.text;
      if (types[name]) continue;
      // A module-level `export` is not a package export. Without this the
      // registry defined types (`PlacedKey`, `ResolvedLayout` - both JSDoc'd
      // "internal") that `exports.types` does not list, so the same artifact
      // advertised a type and reported importing it as invalid.
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
          // Without these a generic reads as if its parameter were a real type:
          // `DataTableColumn` ships fields typed `(row: Row) => …` with nothing
          // saying `Row` is a parameter, so `DataTableColumn[]` looks correct
          // and does not compile. Heritage matters for the same reason - an
          // interface that extends another shipped only its own members.
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
  // `walk` follows readdir order, which differs between filesystems. Sorting
  // keeps the artifact byte-reproducible so a regenerate-and-diff check is
  // possible on a Linux runner as well as here.
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
 * Compound shapes: `Object.assign(Root, { Trigger, Content })` (the usual
 * form) and the plain object literal `Collapsible` uses. They differ in one
 * way that matters to a consumer - an `Object.assign` root is itself
 * renderable, an object literal is not - so both are recorded with
 * `rootRenderable`.
 */
/**
 * Where a component's props come from when it declares no named `*Props` type.
 *
 * Most compound parts wrap a Base UI primitive directly - `forwardRef<HTMLElement,
 * React.ComponentPropsWithoutRef<typeof Field.Label>>` - so there is no
 * interface for `gen-props.mjs` to pick up and the part arrives with an empty
 * prop list. "Takes no props" is the one thing that is definitely false about
 * it, so record the inherited source instead. Same answer `props.json` already
 * gives for `FormFieldRoot`, which has the same shape.
 */
function collectInlinePropsTypes() {
  const byComponent = new Map();
  for (const file of walk(SRC)) {
    const source = sourceFile(file);
    // `Base` is a per-file import alias, so ten different components all
    // published the identical, unresolvable string
    // `React.ComponentPropsWithoutRef<typeof Base.Root>` - naming ten different
    // Base UI packages. Resolve the alias to the module it came from.
    const imports = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
      const from = statement.moduleSpecifier.getText(source).slice(1, -1);
      const named = statement.importClause.namedBindings;
      if (named && ts.isNamespaceImport(named)) imports.set(named.name.text, `import("${from}")`);
      if (statement.importClause.name) {
        imports.set(statement.importClause.name.text, `import("${from}").default`);
      }
      // The form this codebase actually uses: `import { Dialog as Base } from
      // "@base-ui/react/dialog"`. Missing it left every `typeof Base.Root`
      // unresolved, which was the whole problem.
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
      // The thinnest form of all: a part re-exported straight from Base UI
      // (`export const TooltipTrigger = Base.Trigger`). It adds nothing, which
      // is exactly what a consumer needs told - its whole API is the primitive's.
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
            // `Object.assign(DialogRoot, {…})` - the root's own implementation.
            // `Dialog` is the export, but the props live on `DialogRoot`.
            root: init.arguments[0].getText(source),
            parts: partsOf(init.arguments[1], source),
            file,
          });
        } else if (ts.isObjectLiteralExpression(init) && /^[A-Z]/.test(name)) {
          const parts = partsOf(init, source);
          // An object literal of capitalised component references, not a
          // config object: every value has to look like a component.
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
 * The exact predicate `tsup.config.ts` uses, deliberately - so the registry and
 * the build can never disagree about which files carry the directive. An AST
 * directive-prologue check would accept a file the build silently drops.
 */
function isClientComponent(file) {
  return fs.readFileSync(file, "utf8").startsWith('"use client";');
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/** `[data-fuji-theme="dark"][data-fuji-elevation="floating"]` -> `dark:floating`. */
function scopeOf(selector) {
  if (selector === ":root") return "root";
  const parts = [];
  for (const [, axis, value] of selector.matchAll(
    /\[data-fuji-(theme|glass|radius|elevation)="([^"]+)"\]/g,
  )) {
    parts.push(axis === "theme" ? value : `${axis}:${value}`);
  }
  return parts.length ? parts.join("+") : null;
}

/**
 * Which slice of the system a token belongs to, so a consumer can ask for the
 * colors without also being handed every duration and shadow. All ninety-nine
 * in one response is several thousand tokens of an agent's context spent on
 * data it did not ask for.
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
    // Fallback and preference blocks (`@media (prefers-reduced-transparency)`,
    // `@supports not (backdrop-filter)`) restate tokens for conditions a
    // consumer cannot query from JS. Summarised rather than flattened in -
    // merging them would silently overwrite the real values.
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
        // The body is NOT inlined. `docs/` ships in the tarball, so a consumer
        // reads the file when it is actually asked for - inlining ~90 KB of
        // prose would make every consumer pay to load it and tempt a tool into
        // returning a whole guide where a section would do.
        path: `docs/${name}`,
        // Byte length, not `text.length` - that counts UTF-16 code units, and
        // this repo's prose is full of en dashes and arrows, so they disagree.
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
 * Attaches the allowed values to a prop, from its alias or from a union written
 * inline. Inlined per prop rather than left to a lookup in `types`: a
 * `get_component` response has to stand on its own in an agent's context, and
 * a short array of short strings costs a handful of tokens.
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
      // The human page title, which is not always the export name: the page
      // called "Icon Button" documents `IconButton`, and the "Layout" page
      // documents five separate exports.
      title: meta.name,
      slug,
      category: meta.category,
      summary: meta.summary,
      keywords: meta.keywords ?? [],
      import: `import { ${name} } from "${pkg.name}";`,
      source: relative,
      clientComponent: isClientComponent(exported.file),
      propsType: props?.key,
      // Same fallback the parts get. A root that re-exports a Base UI primitive
      // (`export const DialogRoot = Base.Root`) declares no local props type, so
      // without this it published `props: []` with no `extends` - which reads as
      // "takes nothing" for `Dialog`, `Tabs`, `Popover`, `Drawer` and nine more,
      // all of them `rootRenderable`.
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
                // Only a name the package actually exports can be imported. A
                // Server Component has to use this form - see the
                // server-component-subparts convention.
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
    // Hooks, helpers and the types themselves are exported without being
    // catalogued components; only an uncatalogued component matters here.
    // Hooks and lowercase helpers, the props types themselves, and
    // SCREAMING_CASE constants are exports but not components.
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
  // The root needs this as much as its parts do, and went unchecked: 13
  // components shipped describing no API at all. A non-renderable root
  // (`Collapsible` is a namespace object, not a component) is exempt - it takes
  // no props because it is never rendered.
  if (component.parts?.rootRenderable !== false && !component.props.length && !component.extends) {
    warnings.push(`${component.name} describes no props and no inherited source`);
  }
  for (const part of component.parts?.items ?? []) {
    if (!part.namedExport) warnings.push(`${component.name}.${part.name} has no named export`);
    // Neither its own props nor a stated inheritance: the entry says nothing,
    // and a reader takes that to mean "takes no props".
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
  categories: metadata.categories,
  // Canonical definitions, once. Props carry their own `values` too, so a
  // single component's payload is self-contained; this is for a consumer that
  // wants the whole vocabulary (a linter, a completion list).
  types: TYPES,
  /**
   * Every public export name, split by kind.
   *
   * A consumer checking "is this import real?" cannot answer it from
   * `components` - that lists only the catalogued components (see
   * `components.length`, or `stats.components` below, for the current count -
   * it drifts as components are added and is not worth hardcoding here), while
   * the package exports far more: the `*Root` values, every `*Props`
   * interface, item types like `SelectItem` and `TreeNode`, hooks, and
   * helpers. Answering from the short list means reporting correct code as
   * broken, which is worse than not checking at all.
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
   * The listing shape, precomputed.
   *
   * A catalogue listing is the most-called tool and the one most easily got
   * wrong: handing back the `components` array costs ~47k tokens of a caller's
   * context, against ~3.5k for these four fields - and the caller wanted the
   * four fields. Keeping it in the artifact rather than leaving each consumer
   * to remember the projection is worth the duplication, which costs only
   * bytes on disk (nobody sends this file to a model).
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
