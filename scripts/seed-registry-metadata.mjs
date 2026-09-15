#!/usr/bin/env node
// Seeds `registry/` from the documentation site.
//
// Categories, one-line summaries, search keywords and usage examples are the
// parts of a component's description that no script can derive from source -
// somebody wrote them. They were written in the website repo, which inverts the
// source-of-truth rule in AGENTS.md: the library is a dependency of the site,
// so the site cannot be where the library's own description lives, and nothing
// shipped in the npm package could reach it.
//
// This moves them here once. It is kept rather than deleted so that when the
// site gains a component page the import becomes a diff to review rather than
// an authoring task - but `registry/` is the source of truth from now on, and
// re-running this will overwrite hand edits. Check `git diff` before accepting.
//
// Usage: node scripts/seed-registry-metadata.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SITE = path.join(ROOT, "..", "fuji-ui-website");
const REGISTRY = path.join(ROOT, "registry");

if (!fs.existsSync(SITE)) {
  console.error(
    `documentation site not found at ${SITE}\nClone it alongside this repo (see CONTRIBUTING.md).`,
  );
  process.exit(1);
}

/**
 * Runs a TypeScript data module and returns its exports.
 *
 * Regex over the source would be wrong: these modules use shared consts and
 * spread helpers that have to actually execute. Both are import-free once the
 * types are erased, so transpiling to a `data:` URL is enough and avoids adding
 * a TS loader as a devDependency.
 */
async function importModule(file) {
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

function sourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );
}

/** `slug: "card"` -> the page component that renders it, from the file's tail record. */
function pageComponentSlugs(source) {
  const slugs = new Map();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      /Pages$/.test(node.name.getText(source)) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const slug = property.name.getText(source).replace(/^["']|["']$/g, "");
        slugs.set(property.initializer.getText(source), slug);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return slugs;
}

/** The nearest enclosing named function declaration, which is the page component. */
function enclosingFunction(node, source) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.getText(source);
  }
  return undefined;
}

function stringOf(initializer, source) {
  if (!initializer) return undefined;
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.text;
  }
  if (ts.isJsxExpression(initializer)) return stringOf(initializer.expression, source);
  return undefined;
}

function collectExamples() {
  const bySlug = new Map();
  const dir = path.join(SITE, "src", "content", "component-pages");
  for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith(".tsx"))) {
    const source = sourceFile(path.join(dir, name));
    const slugs = pageComponentSlugs(source);
    const visit = (node) => {
      const isExample =
        (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        node.tagName.getText(source) === "ComponentExample";
      if (isExample) {
        const slug = slugs.get(enclosingFunction(node, source) ?? "");
        if (slug) {
          const props = {};
          for (const attribute of node.attributes.properties) {
            if (!ts.isJsxAttribute(attribute)) continue;
            props[attribute.name.getText(source)] = stringOf(attribute.initializer, source);
          }
          if (props.code) {
            const list = bySlug.get(slug) ?? [];
            list.push({ title: props.title, description: props.description, code: props.code });
            bySlug.set(slug, list);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return bySlug;
}

const { COMPONENT_CATALOG } = await importModule(path.join(SITE, "src", "content", "component-catalog.ts"));
/**
 * `CATEGORY_ORDER` is read syntactically rather than imported: its module
 * imports a relative specifier that a `data:` URL cannot resolve, and the value
 * itself is a literal array.
 */
const ORDER = (() => {
  const file = path.join(SITE, "src", "content", "component-registry.ts");
  const source = sourceFile(file);
  let found;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "CATEGORY_ORDER" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      found = node.initializer.elements.map((element) => element.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!found) throw new Error(`CATEGORY_ORDER not found in ${file}`);
  return found;
})();

fs.mkdirSync(path.join(REGISTRY, "examples"), { recursive: true });

// Merge, do not replace: `exports` is hand-authored here for the slugs that
// document more than one component, and re-seeding must not drop it.
const metadataPath = path.join(REGISTRY, "metadata.json");
const existing = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, "utf8")) : {};
const metadata = {
  categories: ORDER,
  components: Object.fromEntries(
    COMPONENT_CATALOG.map((entry) => [
      entry.slug,
      {
        ...existing.components?.[entry.slug],
        name: entry.name,
        category: entry.category,
        summary: entry.summary,
        keywords: entry.keywords ?? [],
      },
    ]),
  ),
};
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + "\n");

// Markdown, not JSON strings: 200-odd snippets stored as escaped
// `"code": "<Button size=\\\"sm\\\">"` survives neither review nor maintenance.
const examples = collectExamples();
let written = 0;
let kept = 0;
let elided = 0;
for (const [slug, list] of [...examples].sort(([a], [b]) => a.localeCompare(b))) {
  // Never overwrite a file that already exists. These are hand-finished after
  // seeding - elided snippets expanded, prose tightened - and clobbering that
  // silently is exactly the accident this script would otherwise cause every
  // time it runs. Delete a file to re-seed it.
  const target = path.join(REGISTRY, "examples", `${slug}.md`);
  if (fs.existsSync(target)) {
    kept += 1;
    continue;
  }
  const body = list
    .map((example) => {
      const parts = [`## ${example.title ?? "Example"}`];
      if (example.description) parts.push(example.description);
      // A snippet with a literal `...` reads as valid JSX and is not - an agent
      // will copy it verbatim. Flag it here; expand it by hand.
      if (example.code.includes("...")) {
        parts.push("<!-- TODO: elided snippet, expand -->");
        elided += 1;
      }
      parts.push("```tsx\n" + example.code + "\n```");
      return parts.join("\n\n");
    })
    .join("\n\n");
  fs.writeFileSync(target, body + "\n");
  written += 1;
}

const undocumented = COMPONENT_CATALOG.filter((entry) => !entry.summary).map((entry) => entry.slug);
console.log(
  `Wrote registry/metadata.json (${COMPONENT_CATALOG.length} components) and ` +
    `${written} new registry/examples/*.md (${kept} existing file(s) left untouched)`,
);
if (elided) console.log(`  ${elided} snippet(s) contain "..." and are marked TODO - expand them by hand.`);
if (undocumented.length) console.log(`  no summary: ${undocumented.join(", ")}`);
