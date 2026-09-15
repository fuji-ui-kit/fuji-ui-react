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

/**
 * Controlled/uncontrolled prop pairs, per SPEC §4. The leading `\s` in the
 * lookups is what keeps `value` from matching inside `defaultValue`.
 */
const CONTROLLED_PAIRS = [
  ["value", "defaultValue"],
  ["open", "defaultOpen"],
  ["checked", "defaultChecked"],
  ["index", "defaultIndex"],
] as const;

/**
 * Checks agent-written code against the contracts in SPEC.md and
 * ARCHITECTURE.md - the ones a model gets wrong in predictable ways because
 * they are conventions rather than type errors, so nothing else catches them.
 *
 * Text matching, not a parser: a fragment mid-generation does not parse, and
 * that is exactly the input worth checking. The cost of that choice is that
 * every rule has to be conservative. A false positive here is worse than a
 * miss - it tells an agent that correct code is broken, and the agent "fixes"
 * it into something that is.
 */
export function reviewUsage(code: string, registry: Registry): Finding[] {
  const findings: Finding[] = [];
  const pkg = registry.package.name;

  const add = (rule: string, line: number, problem: string, fix: string) => {
    const known = registry.conventions.find((entry) => entry.id === rule);
    findings.push({ rule, line, problem, fix, source: known?.source ?? "SPEC.md" });
  };

  // Everything the package really exports, values and types alike. Built from
  // the registry's own export list, never from the component catalogue - the
  // catalogue holds far fewer names than there are real exports, and the
  // difference is entirely legitimate imports (`DialogRoot`, `SelectItem`,
  // `TreeNode`, every `*Props`). Counts deliberately not quoted here: they
  // move every release, and a stale number reads as a contract.
  const exportedValues = new Set(registry.exports.values);
  const exportedAll = new Set([...registry.exports.values, ...registry.exports.types]);

  // Local binding -> exported name, for the names this file imports from this
  // package. Filled in by the import loop below, which runs before any rule
  // reads it. `import { Card as FCard }` has to resolve `<FCard>` to `Card`, or
  // every rule silently skips it.
  const importedFromPkg = new Map<string, string>();
  /** A tag as written, with its root resolved through any local alias. */
  const resolveTag = (name: string) => {
    const [root = name, ...rest] = name.split(".");
    return [importedFromPkg.get(root) ?? root, ...rest].join(".");
  };

  // Only names this package actually provides AND that this file imported from
  // it. Checking the export set alone applied Fuji's rules to any library
  // sharing a name - and the overlap is large: `Select`, `Card`, `Tabs`,
  // `Dialog`, `IconButton`, `Button` are Radix, MUI, Chakra and Base UI names
  // too. Base UI is Fuji's own runtime dependency, so its docs tripped this.
  //
  // A snippet with no imports at all is the tool's primary input, and there the
  // export set is the best evidence available.
  const importsAnything = /^\s*import\s/m.test(code);
  const isFujiComponent = (name: string) => {
    const root = name.split(".")[0] ?? name;
    if (importsAnything) return importedFromPkg.has(root);
    return exportedValues.has(root);
  };

  // Props keyed by the tag as it is actually written, so `Sidebar.Item` resolves
  // as readily as `Button`. Sub-parts were previously unreachable, which left
  // every rule below blind to them.
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

  // A bare fragment is the input this tool is built for - mid-generation code
  // that does not parse and has no module structure. Module-level rules cannot
  // be judged against one: a fragment has no import list, so "no stylesheet"
  // and "no `use client`" are absences of context, not mistakes. Asking them of
  // a fragment flags the package's own documented examples.
  const isModule = /^\s*(?:import|export)\s/m.test(code);

  // Two masked copies, both length-preserving so every index still addresses
  // `code`. Everything below reads one of them, never the raw source.
  //
  // `masked` blanks comments AND strings; `specifiers` blanks comments only.
  // Rules that match an import specifier need the string contents, so they read
  // `specifiers` - but a `<Card theme="dark" />` written inside a string
  // literal is documentation, not code, so `isCode` rejects any position the
  // full mask blanked. Without this, JSX and imports in a JSDoc `@example`, a
  // `// TODO:` line, or a snippet constant all produced findings - this file
  // flagged its own comments.
  const masked = maskLiteralsAndComments(code);
  const specifiers = maskLiteralsAndComments(code, false);
  const isCode = (index: number) => masked[index] === code[index];
  // Stricter still for tags: template literals are masked too.
  const tagMask = maskLiteralsAndComments(code, true, true);
  const isLiveJsx = (index: number) => tagMask[index] === code[index];

  // "A module with no `use client`" is only a Server Component under a
  // framework that has them. Vite, CRA, Remix and Storybook consumers never
  // write the directive anywhere, so treating its absence as proof reported
  // every dot-access sub-part in every file of those apps as broken - including
  // this repo's own `fixtures/plain-vite`. Require positive evidence instead.
  //
  // Two signals: a `next/` import, or an async default-exported component,
  // which only a Server Component can be. Read from masked code so a `next/`
  // URL in a comment does not count. Deliberately NOT `"use server"` - that
  // marks a server-actions module, not a Server Component.
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
  // SPEC §8 - the package ships pre-compiled CSS, so a consumer that never
  // imports it renders every component unstyled with nothing in the console.
  //
  // Scoped to a module that BOTH mounts the React root and renders the
  // provider. "Renders FujiProvider" alone was wrong: in the standard Vite
  // layout the stylesheet is imported in `main.tsx` and the provider lives in
  // `App.tsx`, and Next.js splits them the same way across `layout.tsx` and a
  // `providers.tsx` client component. It flagged this repo's own
  // `fixtures/plain-vite/src/App.tsx`, which is correct code.
  //
  // Read from `masked` so `<FujiProvider>` inside a comment or a string is not
  // mistaken for rendering one - docs/ssr.md tripped exactly that.
  const provider = /<FujiProvider[\s/>]/.exec(masked);
  const mountsRoot = /\b(?:createRoot|hydrateRoot|ReactDOM\.render)\s*\(/.test(masked);
  // A test may legitimately mount a root and render the provider without ever
  // importing the stylesheet - it asserts behaviour, not appearance.
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

  // ---- class names ---------------------------------------------------------
  // Two conditions, both required.
  //
  // The interpolation must CONTINUE a class token: `bg-fuji-${tone}` never
  // reaches Tailwind's static scan, while `` `px-4 ${className}` `` is a whole,
  // already-written class being merged and is the standard idiom. The character
  // immediately before `${` is what tells them apart.
  //
  // And it must be INSIDE a class expression. Testing "is there a class-ish word
  // within 200 characters" flagged `key={`row-${i.id}`}` in any list that also
  // had a className, and `id={`field-${id}`}` beside `className={cls}` - both
  // correct, everyday code.
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
  // `scanTags` finds every tag, nested ones included, and gives each its OWN
  // attributes. That matters more than it sounds: reading an attribute list with
  // a regex meant a child passed as a prop
  // (`renderOption={(o) => <Option value={o.id} />}`) had its props read as the
  // parent's, and the parent was told it passed both `value` and `defaultValue`.
  for (const { name, attrs, index } of scanTags(specifiers)) {
    if (!isLiveJsx(index)) continue;
    // Filter first. `lineOf` copies the string up to the match, so running it
    // for every capitalised tag made this quadratic - 15s on a 1500-line file
    // that produced no findings at all.
    if (!isFujiComponent(name)) continue;
    // Resolved for lookups, `name` for display: an alias must still find its
    // props, and the message must still name what the author actually wrote.
    const canonical = resolveTag(name);
    const line = lineOf(index);
    const [root, part] = canonical.split(".");

    // SPEC §2 - appearance belongs to the provider, not to components.
    // `material` is here because it is a real axis (SPEC §2: `theme` and
    // `material` are orthogonal). It was missed when the axis split landed, so
    // `<Card material="glass">` - exactly the mistake this rule exists to catch
    // - produced no finding at all.
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

    // `glassTint` was removed with the theme x material split - glass now
    // follows the active `theme`. Kept as its own check rather than dropped:
    // a model trained on the older API still writes it, and silently ignoring
    // it is worse than saying what replaced it. Reported on the provider too,
    // because the provider does not take it either any more.
    if (attrs.has("glassTint")) {
      add(
        "removed-api",
        line,
        `<${clip(name)}> is given a "glassTint" prop, which no longer exists.`,
        `Glass now follows the active theme - light theme tints glass light, dark tints it dark. Drop the prop; use material="glass" on FujiProvider to turn glass on.`,
      );
    }

    // SPEC §4 - one convention throughout: `value` + `onChange` controlled,
    // `defaultValue` uncontrolled. Passing both is not a merge; the component
    // is controlled and the default is silently dropped, which reads at a
    // glance like an initial value that simply never appears.
    for (const [controlled, uncontrolled] of CONTROLLED_PAIRS) {
      const a = attrs.get(controlled);
      const b = attrs.get(uncontrolled);
      if (!a || !b) continue;
      // At least one has to be a value the author chose here. A wrapper that
      // forwards both (`<Input value={value} defaultValue={defaultValue} />`,
      // which is how SearchInput is built) passes exactly one of them at
      // runtime and is the correct way to write that component.
      if (a.kind === "expression" && b.kind === "expression") continue;
      add(
        "value-defaultvalue",
        line,
        `<${clip(name)}> passes both "${controlled}" and "${uncontrolled}". That makes it controlled, and "${uncontrolled}" is ignored.`,
        `Keep "${controlled}" with its change handler, or drop it and keep "${uncontrolled}" alone.`,
      );
    }

    // SPEC §4 - icons are component references: not a name, not an element.
    //
    // Keyed on the prop's declared TYPE, not its name: of the ten props called
    // `icon`, seven take `React.ReactNode`, where `<Sidebar.Item icon={<Home />} />`
    // is correct and `icon={Home}` would render nothing.
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

    // Values the prop does not accept. Reads through the tag map, so a
    // sub-part's props are checked too - they were skipped entirely before.
    for (const prop of propsByTag.get(canonical) ?? []) {
      if (!prop.values?.length) continue;
      const attr = attrs.get(prop.name);
      // Only a literal can be checked; `size={x}` is unknowable from here.
      if (attr?.kind !== "string" || prop.values.includes(attr.value)) continue;
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
 * Every JSX opening tag in the document, each with its own parsed attributes.
 *
 * A flat scan, so a tag nested inside another tag's prop is visited in its own
 * right rather than being swallowed by its parent - `<Card header={<Button
 * size="medium"/>}>` now reports the Button, which no earlier version did.
 *
 * Scanning rather than regex-matching is what makes that possible. A regex has
 * to guess where a tag ends, and every guess was wrong somewhere: `>` inside a
 * string, the `>` of an arrow function, or brace nesting deeper than the
 * pattern spelled out.
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
 * The `>` that closes an opening tag: the first one at brace depth zero and
 * outside any string. Depth is what makes `onClick={() => x}` safe - the arrow's
 * `>` is inside braces, so it never looks like the end of the tag.
 */
function findTagEnd(code: string, from: number) {
  let depth = 0;
  let quote = "";
  for (let i = from; i < code.length; i++) {
    const char = code[i]!;
    if (quote) {
      // Count the run of backslashes: `"a\\\\"` ends the string, `"a\\""` does not.
      // Looking at one character behind treated an escaped backslash as an
      // escape, so quote parity inverted for the rest of the scan - an element
      // then absorbed the next element's attributes, or was dropped entirely.
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
 * An attribute list, parsed into `name -> value`.
 *
 * Structure is what the rules need. Testing an attribute list with
 * `\svalue(?:\s*=|[\s/>])` matched a destructured callback argument
 * (`onValueChange={({ value }) => …}`), a shorthand property, and the word in a
 * comment - all reported as the component being passed `value`.
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
 * Character ranges that are class expressions: the body of `className={…}` and
 * of a `clsx(…)` / `cn(…)` / `twMerge(…)` call. Brace- and paren-matched rather
 * than regex-bounded, so a nested object or call inside them is included.
 *
 * An interpolation outside every one of these is not a class name, whatever it
 * sits next to.
 */
function classExpressionRanges(code: string): [number, number][] {
  // Anchors and depth are both read from a copy with comments and quoted
  // strings blanked out. Without it, `const doc = "className={"` opened a range
  // that ran to end of file, and a `{` inside a quoted string threw the depth
  // count off so a real class expression's range vanished.
  const masked = maskLiteralsAndComments(code);
  const ranges: [number, number][] = [];
  const match = (from: number, open: string, close: string) => {
    let depth = 0;
    // An unbalanced delimiter would otherwise scan to end of file from every
    // anchor, which is quadratic on a large input.
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
 * `code` with line comments, block comments and quoted strings replaced by
 * spaces, preserving every offset so ranges still index the original.
 *
 * Template literals are left intact: their `${…}` is the very thing the
 * class-name rule looks for, and interpolations are brace-balanced anyway.
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
      // Only for the tag scan. A `<Card …>` inside a template literal is a
      // string being built, not JSX being rendered. The class-name rule reads a
      // copy that KEEPS templates, because `${…}` inside one is exactly what it
      // looks for.
      let j = i + 1;
      while (j < code.length && code[j] !== "`") j += code[j] === "\\" ? 2 : 1;
      blank(i, Math.min(j + 1, code.length));
      i = j;
    } else if (code[i] === '"' || code[i] === "'") {
      // Strings are always SKIPPED, and only blanked when asked. Skipping them
      // either way is what stops `const OPEN = "/*"` from being read as the
      // start of a block comment and blanking the rest of the file - which it
      // did, silently disabling the checks that read this copy.
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

/**
 * Match text is interpolated into findings, and the input is only capped at
 * 64k - so an attribute value or import path could make one finding larger
 * than the whole response budget. Clip what gets echoed back.
 */
function clip(value: string, max = 80) {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

/**
 * `pkg.replace("/", "\\/")` escaped only the first slash, and `\/` means
 * nothing to the `RegExp` constructor anyway - while `.` in a package name
 * stayed a wildcard. Escape properly instead.
 */
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
