import type { Prop, Registry } from "./registry.js";

export interface Finding {
  rule: string;
  line: number;
  problem: string;
  fix: string;
  source: string;
}

/** One parsed JSX attribute. The kind is what most rules actually turn on. */
type Attribute =
  { kind: "string"; value: string } | { kind: "expression"; value: string } | { kind: "boolean" };

interface TagHit {
  name: string;
  attrs: Map<string, Attribute>;
  index: number;
}

/** A spread (`{...props}`) is recorded under this key - it can carry anything. */
const SPREAD = "...";

/** Controlled/uncontrolled prop pairs (SPEC §4). */
const CONTROLLED_PAIRS = [
  ["value", "defaultValue"],
  ["open", "defaultOpen"],
  ["checked", "defaultChecked"],
  ["index", "defaultIndex"],
] as const;

/**
 * Checks agent code against SPEC/ARCHITECTURE conventions no type checker catches. Text matching,
 * since fragments don't parse; rules stay conservative, as false positives get correct code "fixed".
 */
export function reviewUsage(code: string, registry: Registry): Finding[] {
  const findings: Finding[] = [];
  const pkg = registry.package.name;

  const add = (rule: string, line: number, problem: string, fix: string) => {
    const known = registry.conventions.find((entry) => entry.id === rule);
    findings.push({ rule, line, problem, fix, source: known?.source ?? "SPEC.md" });
  };

  // Every real export, values and types. From the registry's export list, not the component
  // catalogue, which misses legitimate imports like `DialogRoot`, `SelectItem`, every `*Props`.
  const exportedValues = new Set(registry.exports.values);
  const exportedAll = new Set([...registry.exports.values, ...registry.exports.types]);

  // Local binding -> exported name, filled by the import loop below before any rule reads it.
  // `import { Card as FCard }` must resolve `<FCard>` to `Card`, or every rule skips it.
  const importedFromPkg = new Map<string, string>();
  /** A tag as written, with its root resolved through any local alias. */
  const resolveTag = (name: string) => {
    const [root = name, ...rest] = name.split(".");
    return [importedFromPkg.get(root) ?? root, ...rest].join(".");
  };

  // Names this file imported from the package - the export set alone matched Radix/MUI/Base UI
  // `Select`, `Card`, `Dialog`... A snippet with no imports (the primary input) falls back to the
  // export set, the best evidence there.
  const importsAnything = /^\s*import\s/m.test(code);
  const isFujiComponent = (name: string) => {
    const root = name.split(".")[0] ?? name;
    if (importsAnything) return importedFromPkg.has(root);
    return exportedValues.has(root);
  };

  // Props keyed by the tag as written, so sub-parts like `Sidebar.Item` resolve too.
  const propsByTag = new Map<string, Prop[]>();
  for (const component of registry.components) {
    propsByTag.set(component.name, component.props ?? []);
    for (const part of component.parts?.items ?? []) {
      propsByTag.set(`${component.name}.${part.name}`, part.props ?? []);
    }
  }

  const clientOnly = new Map(registry.components.map((c) => [c.name, c.clientComponent]));
  const hasUseClient = /^\s*["']use client["'];?/m.test(code);
  const lineOf = (index: number) => code.slice(0, index).split("\n").length;

  // Module-level rules only apply to modules: in a bare fragment "no stylesheet" or "no
  // `use client`" is missing context, not a mistake, and would flag our own documented examples.
  const isModule = /^\s*(?:import|export)\s/m.test(code);

  // Length-preserving masked copies, so indices still address `code`. `masked` blanks comments and
  // strings; `specifiers` blanks comments only (import rules need string contents). `isCode`
  // rejects positions the full mask blanked, so JSX in a JSDoc `@example` or a string is ignored.
  const masked = maskLiteralsAndComments(code);
  const specifiers = maskLiteralsAndComments(code, false);
  const isCode = (index: number) => masked[index] === code[index];
  // Stricter still for tags: template literals are masked too.
  const tagMask = maskLiteralsAndComments(code, true, true);
  const isLiveJsx = (index: number) => tagMask[index] === code[index];

  // Missing `use client` proves nothing in Vite/CRA/Remix apps, so require positive RSC evidence:
  // a `next/` import (masked, so comments don't count) or an async default-exported component.
  // Not `"use server"` - that marks a server-actions module, not a Server Component.
  const looksLikeRsc =
    /from\s+["']next\//.test(specifiers) || /export\s+default\s+async\s+function/.test(code);

  // ---- import statements ---------------------------------------------------
  const subpath = new RegExp(
    `from\\s+["']${escapeForRegExp(pkg)}\\/(?!styles\\.css|tokens\\.css|props\\.json|registry\\.json|package\\.json)([^"']+)["']`,
    "g",
  );
  for (const match of specifiers.matchAll(subpath)) {
    if (!isLiveJsx(match.index ?? 0)) continue;
    add(
      "single-entry-point",
      lineOf(match.index ?? 0),
      `Imports from "${pkg}/${clip(match[1] ?? "")}", which does not exist. Components have no subpath imports.`,
      `Import from "${pkg}" instead.`,
    );
  }

  const importRe = new RegExp(
    `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*["']${escapeForRegExp(pkg)}["']`,
    "g",
  );
  for (const statement of specifiers.matchAll(importRe)) {
    if (!isLiveJsx(statement.index ?? 0)) continue;
    const line = lineOf(statement.index ?? 0);
    for (const raw of (statement[1] ?? "").split(",")) {
      const spec = raw.trim().replace(/^type\s+/, "");
      // `X as Y` binds Y locally but validates X against the export set.
      const local = spec
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      const name = spec.split(/\s+as\s+/)[0]?.trim();
      if (local && name && /^[A-Za-z_]\w*$/.test(local)) importedFromPkg.set(local, name);
      if (!name || !/^[A-Za-z_]\w*$/.test(name) || exportedAll.has(name)) continue;
      const near = closest(name, [...exportedAll]);
      add(
        "single-entry-point",
        line,
        `"${name}" is imported from "${pkg}", which does not export it.`,
        near ? `Did you mean ${near}?` : "Use list_components to see what exists.",
      );
    }
  }

  // ---- stylesheet ----------------------------------------------------------
  // SPEC §8 - without the CSS import everything renders unstyled, silently. Only checked where a
  // module both mounts the root and renders the provider (Vite/Next.js split them across files).
  // Read from `masked` so a `<FujiProvider>` in a comment doesn't count.
  const provider = /<FujiProvider[\s/>]/.exec(masked);
  const mountsRoot = /\b(?:createRoot|hydrateRoot|ReactDOM\.render)\s*\(/.test(masked);
  // Tests assert behaviour, not appearance, so they may skip the stylesheet.
  const isTest = /from\s+["'](?:vitest|@jest\/globals|@testing-library\/)/.test(specifiers);
  if (
    isModule &&
    provider &&
    mountsRoot &&
    !isTest &&
    !new RegExp(`["']${escapeForRegExp(pkg)}/styles\\.css["']`).test(code)
  ) {
    add(
      "stylesheet-required",
      lineOf(provider.index),
      "Renders FujiProvider without importing the stylesheet. Every component renders unstyled, with no error.",
      `Add import "${pkg}/styles.css"; once, at the app root.`,
    );
  }

  // ---- theme switching -----------------------------------------------------
  // SPEC §2 - the provider owns the theme. A `.dark` class toggles nothing in Fuji, and a
  // hand-written data-fuji-* attribute is overwritten on the provider's next render. Only in code
  // that uses Fuji (or a bare fragment, which is what this tool is usually handed).
  if (!importsAnything || importedFromPkg.size > 0) {
    const bypass =
      /\bdocument\.(?:documentElement|body)\.classList\.(?:add|remove|toggle)\(\s*["'`]dark["'`]|\.setAttribute\(\s*["'`]data-fuji-(?:theme|material|radius|elevation)["'`]/g;
    // `specifiers`, not `masked`: the class and attribute names are string literals.
    for (const match of specifiers.matchAll(bypass)) {
      add(
        "theme-via-provider",
        lineOf(match.index ?? 0),
        "Switches the theme outside FujiProvider. Fuji components ignore a `.dark` class, and the provider overwrites data-fuji-* attributes on its next render.",
        'Use setTheme / setMaterial from useFujiConfig() (or a controlled theme prop). get_appearance topic "toggle" shows it.',
      );
    }
  }

  // ---- class names ---------------------------------------------------------
  // Flag only an interpolation that continues a class token (`bg-fuji-${tone}`, not
  // `` `px-4 ${className}` ``) AND sits inside a class expression - proximity alone flagged
  // `key={`row-${i.id}`}`.
  const classRanges = classExpressionRanges(code);
  for (const match of code.matchAll(/[\w-]\$\{/g)) {
    const index = match.index ?? 0;
    if (!isCode(index)) continue;
    if (!classRanges.some(([start, end]) => index > start && index < end)) continue;
    add(
      "no-templated-classes",
      lineOf(index),
      "Builds a class name at runtime. Tailwind's scanner is a static text scan, so the class is never generated and the element renders unstyled.",
      "Write the full class strings out and branch between them.",
    );
  }

  // ---- JSX elements --------------------------------------------------------
  // `scanTags` gives each tag, nested ones included, its OWN attributes, so a child passed as a
  // prop (`renderOption={(o) => <Option value={o.id} />}`) is not read as the parent's.
  for (const { name, attrs, index } of scanTags(specifiers)) {
    if (!isLiveJsx(index)) continue;
    // Filter first: `lineOf` is O(n), so calling it per tag took 15s on a 1500-line file.
    if (!isFujiComponent(name)) continue;
    // Resolved name for lookups; `name` for messages, so they show what the author wrote.
    const canonical = resolveTag(name);
    const line = lineOf(index);
    const [root, part] = canonical.split(".");

    // SPEC §2 - appearance axes (including `material`) belong to the provider, not components.
    if (root !== "FujiProvider") {
      for (const axis of ["theme", "material", "radius", "elevation"]) {
        if (!attrs.has(axis)) continue;
        add(
          "provider-owned-appearance",
          line,
          `<${clip(name)}> is given a "${axis}" prop. No component takes one.`,
          `Set ${axis} once on FujiProvider; every component reads it from there.`,
        );
      }
    }

    // `glassTint` was removed in the theme x material split; models trained on the old API still
    // write it, so say what replaced it. Reported on the provider too.
    if (attrs.has("glassTint")) {
      add(
        "removed-api",
        line,
        `<${clip(name)}> is given a "glassTint" prop, which no longer exists.`,
        `Glass now follows the active theme - light theme tints glass light, dark tints it dark. Drop the prop; use material="glass" on FujiProvider to turn glass on.`,
      );
    }

    // SPEC §4 - passing both makes the component controlled and silently drops the default.
    for (const [controlled, uncontrolled] of CONTROLLED_PAIRS) {
      const a = attrs.get(controlled);
      const b = attrs.get(uncontrolled);
      if (!a || !b) continue;
      // A wrapper forwarding both as expressions (how SearchInput is built) passes only one at
      // runtime, so at least one must be a literal the author chose here.
      if (a.kind === "expression" && b.kind === "expression") continue;
      add(
        "value-defaultvalue",
        line,
        `<${clip(name)}> passes both "${controlled}" and "${uncontrolled}". That makes it controlled, and "${uncontrolled}" is ignored.`,
        `Keep "${controlled}" with its change handler, or drop it and keep "${uncontrolled}" alone.`,
      );
    }

    // SPEC §4 - icons are component references. Keyed on the prop's TYPE, not its name: seven of
    // the ten `icon` props take `React.ReactNode`, where `icon={<Home />}` is correct.
    for (const prop of propsByTag.get(canonical) ?? []) {
      if (!/\bIconComponent\b/.test(prop.type)) continue;
      const attr = attrs.get(prop.name);
      if (attr?.kind === "string") {
        add(
          "icons-are-components",
          line,
          `${prop.name}="${clip(attr.value)}" passes a string. The prop takes a component.`,
          `Import the icon and pass the reference: ${prop.name}={${toPascal(clip(attr.value, 40))}}.`,
        );
      } else if (attr?.kind === "expression") {
        const rendered = /^\{\s*<\s*([A-Z]\w*)/.exec(attr.value);
        if (rendered) {
          add(
            "icons-are-components",
            line,
            `${prop.name}={<${rendered[1]} />} passes a rendered element. The prop takes the component itself, so it can be sized and coloured by the host.`,
            `Pass the reference: ${prop.name}={${rendered[1]}}.`,
          );
        }
      }
    }

    // SPEC §4 - an icon-only control has no text to name it. `aria-labelledby`
    // is an accessible name too, and a spread can carry either.
    if (
      name === "IconButton" &&
      !attrs.has("aria-label") &&
      !attrs.has("aria-labelledby") &&
      !attrs.has(SPREAD)
    ) {
      add(
        "icon-only-needs-a-name",
        line,
        "<IconButton> without aria-label. It has no text, so it announces as nothing.",
        'Add aria-label="…" describing the action.',
      );
    }

    // SPEC §5 - a static property read does not cross the RSC boundary.
    if (looksLikeRsc && part && root && !hasUseClient && clientOnly.get(root)) {
      const named = `${root}${part}`;
      if (exportedValues.has(named)) {
        add(
          "server-component-subparts",
          line,
          `<${clip(name)}> reads a static property off a client-module binding. In a Server Component that resolves to undefined.`,
          `Import the named sub-export instead: import { ${root}, ${named} } from "${pkg}" and use <${named}>.`,
        );
      }
    }

    // Values the prop does not accept, sub-parts included.
    for (const prop of propsByTag.get(canonical) ?? []) {
      if (!prop.values?.length) continue;
      const attr = attrs.get(prop.name);
      // Only a literal can be checked; `size={x}` is unknowable from here.
      if (attr?.kind !== "string" || prop.values.includes(attr.value)) continue;
      // The most common invalid theme, and the one with a real answer: follow the OS by hand.
      if (/^(?:default)?[Tt]heme$/.test(prop.name) && attr.value === "system") {
        add(
          "theme-via-provider",
          line,
          `<${clip(name)} ${prop.name}="system">: there is no "system" theme.`,
          'Read prefers-color-scheme and pass it as a controlled theme - get_appearance topic "system" has the hook.',
        );
        continue;
      }
      add(
        "allowed-values",
        line,
        `<${clip(name)} ${prop.name}="${clip(attr.value)}"> is not a valid value.`,
        `${prop.name} accepts ${prop.values.map((v) => `"${v}"`).join(" | ")}.`,
      );
    }
  }

  return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

/**
 * Every JSX opening tag with its own attributes, nested tags in props included. Scanned, since a
 * regex can't find the tag end past a `>` in a string, an arrow function, or deep brace nesting.
 */
function* scanTags(code: string): Generator<TagHit> {
  for (const match of code.matchAll(/<([A-Z][\w.]*)/g)) {
    const start = match.index ?? 0;
    const attrsStart = start + match[0].length;
    const end = findTagEnd(code, attrsStart);
    if (end === -1) continue;
    yield { name: match[1] ?? "", attrs: parseAttributes(code.slice(attrsStart, end)), index: start };
  }
}

/**
 * The `>` closing an opening tag: first one at brace depth zero, outside strings. Depth keeps
 * the arrow in `onClick={() => x}` from ending the tag.
 */
function findTagEnd(code: string, from: number) {
  let depth = 0;
  let quote = "";
  for (let i = from; i < code.length; i++) {
    const char = code[i]!;
    if (quote) {
      // Count the backslash run (`"a\\\\"` ends, `"a\\""` doesn't); checking one char inverted
      // quote parity for the rest of the scan.
      if (char === quote && !escaped(code, i)) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth++;
    else if (char === "}") depth = Math.max(0, depth - 1);
    else if (char === ">" && depth === 0) return i;
  }
  return -1;
}

/** Whether `index` is preceded by an odd number of backslashes, i.e. escaped. */
function escaped(text: string, index: number) {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) slashes++;
  return slashes % 2 === 1;
}

/** Index just past the `}` matching the `{` at `from`, string-aware. */
function skipBraces(text: string, from: number) {
  let depth = 0;
  let quote = "";
  for (let i = from; i < text.length; i++) {
    const char = text[i]!;
    if (quote) {
      if (char === quote && !escaped(text, i)) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i + 1;
  }
  return text.length;
}

/**
 * An attribute list parsed into `name -> value`. A regex like `\svalue(?:\s*=|[\s/>])` also
 * matched destructured callback args (`({ value }) => …`) and words in comments.
 */
function parseAttributes(text: string) {
  const out = new Map<string, Attribute>();
  let i = 0;
  while (i < text.length) {
    const char = text[i]!;
    if (char === "{") {
      // `{...props}` - opaque, but it can carry any prop, so record that.
      out.set(SPREAD, { kind: "boolean" });
      i = skipBraces(text, i);
      continue;
    }
    if (!/[A-Za-z_]/.test(char)) {
      i++;
      continue;
    }
    const nameStart = i;
    while (i < text.length && /[\w:.-]/.test(text[i]!)) i++;
    const name = text.slice(nameStart, i);
    while (i < text.length && /\s/.test(text[i]!)) i++;
    if (text[i] !== "=") {
      out.set(name, { kind: "boolean" });
      continue;
    }
    i++;
    while (i < text.length && /\s/.test(text[i]!)) i++;
    const delimiter = text[i];
    if (delimiter === '"' || delimiter === "'") {
      const end = text.indexOf(delimiter, i + 1);
      out.set(name, { kind: "string", value: text.slice(i + 1, end === -1 ? undefined : end) });
      if (end === -1) break;
      i = end + 1;
    } else if (delimiter === "{") {
      const end = skipBraces(text, i);
      out.set(name, { kind: "expression", value: text.slice(i, end) });
      i = end;
    } else {
      out.set(name, { kind: "boolean" });
    }
  }
  return out;
}

/**
 * Ranges of class expressions: `className={…}` and `clsx(…)`/`cn(…)`/`twMerge(…)` bodies,
 * brace/paren-matched so nested objects and calls are included.
 */
function classExpressionRanges(code: string): [number, number][] {
  // Read from a masked copy: a `{` in a string or comment would otherwise skew anchors and depth.
  const masked = maskLiteralsAndComments(code);
  const ranges: [number, number][] = [];
  const match = (from: number, open: string, close: string) => {
    let depth = 0;
    // Cap the scan: an unbalanced delimiter would be quadratic on large input.
    const limit = Math.min(masked.length, from + 4000);
    for (let i = from; i < limit; i++) {
      if (masked[i] === open) depth++;
      else if (masked[i] === close && --depth === 0) return ranges.push([from, i]);
    }
  };
  for (const m of masked.matchAll(/\bclass[nN]ames?\s*=\s*\{/g)) {
    match((m.index ?? 0) + m[0].length - 1, "{", "}");
  }
  for (const m of masked.matchAll(/\b(?:clsx|cn|twMerge|classnames)\s*\(/g)) {
    match((m.index ?? 0) + m[0].length - 1, "(", ")");
  }
  return ranges;
}

/**
 * `code` with comments and quoted strings blanked to spaces, offsets preserved. Template literals
 * are kept by default: their `${…}` is what the class-name rule looks for.
 */
function maskLiteralsAndComments(code: string, maskStrings = true, maskTemplates = false) {
  const out = code.split("");
  const blank = (from: number, to: number) => {
    for (let i = from; i < to && i < out.length; i++) if (out[i] !== "\n") out[i] = " ";
  };
  for (let i = 0; i < code.length; i++) {
    const two = code.slice(i, i + 2);
    if (two === "//") {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      blank(i, stop);
      i = stop;
    } else if (two === "/*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      blank(i, stop);
      i = stop - 1;
    } else if (maskTemplates && code[i] === "`") {
      // Tag scan only: a `<Card …>` inside a template literal is a string, not rendered JSX.
      let j = i + 1;
      while (j < code.length && code[j] !== "`") j += code[j] === "\\" ? 2 : 1;
      blank(i, Math.min(j + 1, code.length));
      i = j;
    } else if (code[i] === '"' || code[i] === "'") {
      // Always skip strings (blank only when asked), so `"/*"` isn't read as a comment opener.
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote && code[j] !== "\n") {
        j += code[j] === "\\" ? 2 : 1;
      }
      if (maskStrings) blank(i, Math.min(j + 1, code.length));
      i = j;
    }
  }
  return out.join("");
}

/** Clips echoed text: input is capped at 64k, so one finding could exceed the response budget. */
function clip(value: string, max = 80) {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

/** Escapes every regex metacharacter, so `.` in a package name is literal. */
function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPascal(value: string) {
  return value.replace(/(^|[-_])(\w)/g, (_, __, char: string) => char.toUpperCase());
}

/** Cheap nearest-name suggestion for an export that does not exist. */
function closest(name: string, candidates: string[]) {
  let best: string | undefined;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const score = editDistance(name.toLowerCase(), candidate.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore <= Math.max(2, Math.round(name.length / 3)) ? best : undefined;
}

export function editDistance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i]![j] = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length]![b.length]!;
}
