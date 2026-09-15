// Generates `dist/props.json`: every exported `*Props` interface/type in the
// built declarations, with each prop's name, type text, required flag,
// default (from a `Default "x"` / `Default x` / `(default ...)` phrase in the
// JSDoc) and description. The documentation site consumes this instead of
// hand-maintaining prop tables that drift from the code.
//
// Uses the TypeScript compiler API that is already a devDependency - no new
// tooling. Run after `npm run build` (the `build` script chains it).
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
 * Where the rest of a component's props come from.
 *
 * Props declared in React's or Base UI's own types are filtered out below -
 * a table listing every DOM attribute is noise - but "this also takes
 * everything `Field.Root` takes" is the sentence a reader needs, and without
 * it a component like `FormField`, whose props are entirely inherited, gets
 * an empty table and no explanation. Read syntactically from the declaration:
 * an interface's heritage clause, or a type alias's right-hand side.
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
 * Import aliases in the rolled-up declarations, resolved to the module they
 * came from.
 *
 * The rollup renames on collision - `import { Dialog as Dialog$1 } from
 * "@base-ui/react/dialog"` - because this package exports its own `Dialog`. The
 * heritage text is read out of that file, so `extends` strings named `Dialog$1`,
 * `Input$1`, `Select$1`: identifiers that exist in no namespace a consumer can
 * reach, and that collide with this package's own exports. `Dialog$1.Popup` was
 * worse than opaque, because `Dialog.Popup` is not even the right part name.
 *
 * The suffix is assigned by rollup collision order, so these strings also churn
 * between builds. Built once, lazily, from the declaration file's own imports.
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
    // Deliberately no bare-word alternative. One existed, and it scavenged
    // English out of prose: "Defaults to false, which keeps..." yielded "to",
    // and "defaults follow the variant's role" yielded "follow" - both shipped.
    // Since defaults are now read from the source destructuring (176 of them),
    // this fallback only has to cover props handled outside the signature, and
    // for those a quoted or backticked value is the honest requirement.
    //
    // The value MUST be quoted or backticked here. An earlier unquoted form
    // matched `default` inside the word `defaults`, so "(defaults to h3, its
    // semantic role)" shipped a default of "s to h3, its semantic role" on
    // `Card.Title.as`. A prop whose default is only ever stated in prose now
    // reports none, which is the honest answer rather than a wrong one.
    text.match(/\(default:?\s*`([^`]+)`\s*\)/) ||
    text.match(/\(default:?\s*"([^"]+)"\s*\)/);
  const value = match?.[1].trim();
  // Guard the same backtracking: a connector word is never a default value.
  return value && !CONNECTORS.has(value) ? value : undefined;
}

const CONNECTORS = new Set(["to", "is", "the", "a", "an"]);

/**
 * The props interface a type annotation ultimately refers to.
 *
 * Defaults are recorded under the annotation's raw text but looked up by the
 * bare interface name, so any wrapper silently lost every default behind it:
 * `DataTableProps<Row>`, `SelectProps<Value>` and
 * `Omit<CarouselProps, "continuous">` never matched, taking `DataTable.pageSize`,
 * `Select.size` and all nine Carousel defaults with them.
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
    // A multi-line or otherwise large initializer is an implementation detail,
    // not something a props table can usefully print.
    if (value.length > 60) continue;
    found.push([name, value]);
  }
  return found;
}

/**
 * Destructuring defaults, read from the component source.
 *
 * A declaration file carries signatures, never bodies, so `dist/index.d.ts`
 * cannot know that `size` defaults to `"md"` - that value exists only in
 * `Button.tsx`'s parameter list. Without it the defaults column had to be
 * recovered from a JSDoc phrase that most props never wrote, and the
 * documentation site hand-maintained its own copy that drifted from the code
 * (its Button table was missing five props outright).
 *
 * Reading the source means a documented default IS what the component does.
 *
 * Syntactic only - `createSourceFile`, no type checker. Every fact needed is
 * in the syntax, and this runs over every source file inside `npm run build`.
 */
function collectDefaults() {
  const byPropsType = new Map();
  const record = (annotation, pattern, source) => {
    if (!annotation || !ts.isObjectBindingPattern(pattern)) return;
    // Normalised, so a wrapper or a type argument still lands on the interface
    // the lookup asks for. Tables merge rather than overwrite, so a component
    // declared twice (Carousel: once bare, once through `Omit<>`) accumulates.
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
      // `React.forwardRef<Ref, XProps>(function X({ size = "md" }, ref) {})`.
      // The second type argument is the authoritative props link - better than
      // mangling a component name into `${name}Props`, which breaks wherever
      // the two do not match.
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

/** Optional props are reported with their own type; the `| undefined` is implied by `required: false`. */
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
      // Source first: the destructuring default is what the component actually
      // does. The JSDoc phrase is the fallback for a prop handled somewhere
      // other than the signature.
      default: sourceDefaults.get(symbol.name)?.get(prop.name) ?? defaultFromDoc(description),
      description: description || undefined,
      deprecated: deprecation(prop),
    });
  }
  const extendsFrom = inheritedFrom(declaration);
  // A table with no own props is still worth emitting when it inherits - that
  // IS the component's API, and the note below is the whole answer.
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
