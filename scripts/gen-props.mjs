// Generates `dist/props.json` from the built declarations: every exported `*Props` with each prop's
// type, required flag, default and description, so the docs site never hand-maintains prop tables.
// Runs after `npm run build` (the `build` script chains it).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const entry = path.join(root, "dist", "index.d.ts");
if (!fs.existsSync(entry)) {
  console.error("dist/index.d.ts not found - run `npm run build` first.");
  process.exit(1);
}

const program = ts.createProgram([entry], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  strict: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
const moduleSymbol = checker.getSymbolAtLocation(source);
const exports = checker.getExportsOfModule(moduleSymbol);

/** Props inherited from the DOM element / Base UI are noise in a table. */
const INHERITED_FROM = /node_modules\/(@types\/react|@base-ui)/;

function docText(symbol) {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

/**
 * Where the rest of the props come from (heritage clause or alias RHS), since inherited ones are
 * filtered out - otherwise wholly inherited `FormField` gets an empty, unexplained table.
 */
function inheritedFrom(declaration) {
  if (ts.isInterfaceDeclaration(declaration)) {
    const clause = declaration.heritageClauses?.find((entry) => entry.token === ts.SyntaxKind.ExtendsKeyword);
    return resolveDtsAliases(clause?.types.map((type) => type.getText()).join(", "));
  }
  if (ts.isTypeAliasDeclaration(declaration)) return resolveDtsAliases(declaration.type.getText());
  return undefined;
}

/**
 * Resolves the d.ts rollup's collision renames (`Dialog as Dialog$1`) to their module: `Dialog$1`
 * is unreachable for consumers and its suffix churns between builds. Built lazily, once.
 */
let dtsAliases;
function resolveDtsAliases(text) {
  if (!text) return text;
  if (!dtsAliases) {
    dtsAliases = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
      const from = statement.moduleSpecifier.getText(source).slice(1, -1);
      // React and the JSX runtime read better under their own names.
      if (!from.startsWith("@base-ui")) continue;
      const named = statement.importClause.namedBindings;
      if (named && ts.isNamespaceImport(named)) dtsAliases.set(named.name.text, `import("${from}")`);
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          const imported = (element.propertyName ?? element.name).text;
          dtsAliases.set(element.name.text, `import("${from}").${imported}`);
        }
      }
    }
  }
  return text.replace(/\b([A-Za-z_$][\w$]*)\b/g, (whole, name) => dtsAliases.get(name) ?? whole);
}

/** `@deprecated Use `effect`.` -> "Use `effect`."; a bare tag -> true. */
function deprecation(symbol) {
  const tag = symbol.getJsDocTags(checker).find((entry) => entry.name === "deprecated");
  if (!tag) return undefined;
  return ts.displayPartsToString(tag.text).trim() || true;
}

function defaultFromDoc(text) {
  // "Default `x`." / "Default "x"." / "Defaults to x." / trailing "(default x)".
  const match =
    text.match(/\b[Dd]efaults?(?: to| is)?:?\s+`([^`]+)`/) ||
    text.match(/\b[Dd]efaults?(?: to| is)?:?\s+"([^"]+)"/) ||
    text.match(/\b[Dd]efaults?(?: to| is)?:?\s+(true|false|null|-?\d+(?:\.\d+)?)\b/) ||
    // The value MUST be quoted or backticked: bare-word forms scavenged prose ("to", "follow",
    // "s to h3, its semantic role" all shipped). Source destructuring supplies most defaults
    // (176), so this only covers props handled outside the signature; prose-only means none.
    text.match(/\(default:?\s*`([^`]+)`\s*\)/) ||
    text.match(/\(default:?\s*"([^"]+)"\s*\)/);
  const value = match?.[1].trim();
  // Guard the same backtracking: a connector word is never a default value.
  return value && !CONNECTORS.has(value) ? value : undefined;
}

const CONNECTORS = new Set(["to", "is", "the", "a", "an"]);

/**
 * The props interface an annotation refers to, so `DataTableProps<Row>` or
 * `Omit<CarouselProps, "continuous">` still key defaults under the bare interface name.
 */
function basePropsName(text) {
  return /\b([A-Z]\w*Props)\b/.exec(text)?.[1] ?? text.trim();
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) out.push(full);
  }
  return out;
}

/** `{ size = "md" }` -> ["size", '"md"']. Renamed bindings key on the prop name. */
function bindingDefaults(pattern, source) {
  const found = [];
  for (const element of pattern.elements) {
    if (!element.initializer || !ts.isIdentifier(element.name)) continue;
    const name = element.propertyName?.getText(source) ?? element.name.getText(source);
    const value = element.initializer.getText(source).replace(/\s+/g, " ");
    // Large initializers are implementation details, not printable defaults.
    if (value.length > 60) continue;
    found.push([name, value]);
  }
  return found;
}

/**
 * Destructuring defaults from component source - d.ts files have no bodies, so this makes a
 * documented default exactly what the component does. Syntactic only (no checker), for speed.
 */
function collectDefaults() {
  const byPropsType = new Map();
  const record = (annotation, pattern, source) => {
    if (!annotation || !ts.isObjectBindingPattern(pattern)) return;
    // Normalised to the bare interface; tables merge, so Carousel (bare and `Omit<>`) accumulates.
    const propsType = basePropsName(annotation);
    const table = byPropsType.get(propsType) ?? new Map();
    for (const [name, value] of bindingDefaults(pattern, source)) table.set(name, value);
    byPropsType.set(propsType, table);
  };

  for (const file of walk(path.join(root, "src"))) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node) => {
      // `forwardRef<Ref, XProps>(function X({ size = "md" }, ref) {})`: the second type argument
      // is the authoritative props link, unlike guessing `${name}Props`.
      if (
        ts.isCallExpression(node) &&
        /forwardRef$/.test(node.expression.getText(source)) &&
        node.typeArguments?.length === 2
      ) {
        const implementation = node.arguments[0];
        const parameter = implementation?.parameters?.[0];
        if (parameter) record(node.typeArguments[1].getText(source), parameter.name, source);
      }
      // `export function X({ series, area = false }: XProps) {}`.
      if (
        (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
        node.parameters.length &&
        node.parameters[0].type
      ) {
        record(node.parameters[0].type.getText(source), node.parameters[0].name, source);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return byPropsType;
}

/** Drops `| undefined` from optional props; `required: false` already implies it. */
function cleanType(text) {
  return text.replace(/\s*\|\s*undefined$/, "").replace(/^undefined\s*\|\s*/, "");
}

const sourceDefaults = collectDefaults();

const result = {};
for (const symbol of exports) {
  if (!/Props$/.test(symbol.name)) continue;
  // `export { X }` statements produce alias symbols; resolve to the real one.
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = target.declarations?.[0];
  if (!declaration) continue;
  const type = checker.getDeclaredTypeOfSymbol(target);
  const props = [];
  for (const prop of type.getProperties()) {
    const decl = prop.declarations?.[0];
    if (!decl) continue;
    const file = decl.getSourceFile().fileName;
    if (INHERITED_FROM.test(file)) continue;
    const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
    const description = docText(prop);
    props.push({
      name: prop.name,
      type: cleanType(checker.typeToString(propType, decl, ts.TypeFormatFlags.NoTruncation)),
      required: !(prop.flags & ts.SymbolFlags.Optional),
      // Source first (what the component does); JSDoc for props handled outside the signature.
      default: sourceDefaults.get(symbol.name)?.get(prop.name) ?? defaultFromDoc(description),
      description: description || undefined,
      deprecated: deprecation(prop),
    });
  }
  const extendsFrom = inheritedFrom(declaration);
  // A table with no own props is still emitted when it inherits - that IS its API.
  if (props.length === 0 && !extendsFrom) continue;
  result[symbol.name] = {
    component: symbol.name.replace(/Props$/, ""),
    description: docText(target) || undefined,
    extends: extendsFrom,
    props: props.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)),
  };
}

const out = path.join(root, "dist", "props.json");
fs.writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
const rows = Object.values(result).flatMap((table) => table.props);
const withDefault = rows.filter((prop) => prop.default !== undefined).length;
const documented = rows.filter((prop) => prop.description).length;
console.log(
  `Wrote ${out} (${Object.keys(result).length} prop tables, ${rows.length} props, ` +
    `${documented} documented, ${withDefault} with a default)`,
);
