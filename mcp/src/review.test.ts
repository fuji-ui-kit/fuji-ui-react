import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { reviewUsage } from "./review.js";
import type { Registry } from "./registry.js";

/**
 * `review_usage` is the tool that is supposed to raise an agent's output
 * quality, and it is the one place where being wrong is worse than being
 * absent: a false positive tells an agent that correct code is broken, and the
 * agent "fixes" it into something that is.
 *
 * Every case below was a real defect. The checker built its known-export set
 * from the 88-component catalogue rather than the 308 real exports, so
 * `DialogRoot` and `SelectItem` were reported as hallucinated; it flagged the
 * universal `${className}` merge idiom; it applied Fuji's rules to any
 * capitalised tag; and every JSX rule was line-scoped, so Prettier's own
 * formatting hid all of them.
 */
const REGISTRY = path.join(__dirname, "..", "..", "dist", "registry.json");
const registry: Registry | null = fs.existsSync(REGISTRY)
  ? (JSON.parse(fs.readFileSync(REGISTRY, "utf8")) as Registry)
  : null;

const rules = (code: string) => reviewUsage(code, registry!).map((f) => f.rule);

describe.skipIf(!registry)("review_usage", () => {
  describe("does not flag correct code", () => {
    it("accepts exports outside the component catalogue", () => {
      expect(rules(`import { DialogRoot, TabsRoot, SelectItem, TreeNode } from "@fujiui/react";`)).toEqual(
        [],
      );
    });

    it("accepts a whole class name interpolated into a template", () => {
      expect(rules("const C = ({ className }) => <div className={`px-4 ${className}`} />;")).toEqual([]);
    });

    it("leaves a consumer's own components alone", () => {
      expect(rules(`<MyChart theme="dark" />`)).toEqual([]);
    });

    it("accepts a dot-access sub-part inside a client module", () => {
      expect(rules(`"use client";\n<Dialog><Dialog.Content /></Dialog>`)).toEqual([]);
    });
  });

  describe("catches what it is for", () => {
    it("a class name assembled at runtime", () => {
      expect(rules('<div className={clsx("p-2", `bg-${c}-500`)} />')).toContain("no-templated-classes");
    });

    it("a violation on a multi-line element", () => {
      // Prettier wraps any element with more than about two props, so this is
      // what real code looks like.
      expect(rules(`<Card\n  theme="dark"\n  effect="lift"\n>\n  hi\n</Card>`)).toContain(
        "provider-owned-appearance",
      );
    });

    it("an icon passed as a rendered element", () => {
      expect(rules(`<Icon icon={<Star />} />`)).toContain("icons-are-components");
    });

    it("an icon passed as a string", () => {
      expect(rules(`<Icon icon="check" />`)).toContain("icons-are-components");
    });

    it("a value the prop does not accept", () => {
      expect(rules(`<Button size="medium">Save</Button>`)).toContain("allowed-values");
    });

    it("an import the package does not export", () => {
      expect(rules(`import { Buton } from "@fujiui/react";`)).toContain("single-entry-point");
    });

    it("a subpath import", () => {
      expect(rules(`import { Button } from "@fujiui/react/button";`)).toContain("single-entry-point");
    });

    it("an icon-only control with no accessible name", () => {
      expect(rules(`<IconButton><Trash /></IconButton>`)).toContain("icon-only-needs-a-name");
    });

    it("a dot-access sub-part in a Server Component", () => {
      // Needs positive evidence of a framework that HAS Server Components. In a
      // Vite or CRA app nobody writes "use client" anywhere, so its absence
      // proves nothing - see the false-positive case below.
      expect(
        rules(
          `import Link from "next/link";\nimport { Dialog } from "@fujiui/react";\n<Dialog><Dialog.Content /></Dialog>`,
        ),
      ).toContain("server-component-subparts");
    });

    /**
     * `material` was missed when the theme x material split landed: the axis
     * list still named the removed `glassTint`, so `<Card material="glass">` -
     * precisely the mistake this rule exists to catch - produced no finding.
     * Verified by removing "material" from the axis list and watching this go
     * red while the `theme` case above stayed green.
     */
    it("the material axis on a component, not just theme", () => {
      expect(rules(`<Card material="glass" />`)).toContain("provider-owned-appearance");
    });

    it("names glassTint as removed rather than ignoring it", () => {
      // A model trained on the older API still writes it; saying what replaced
      // it beats silence. Reported on the provider too - it does not take it
      // either any more.
      expect(rules(`<Card glassTint="light" />`)).toContain("removed-api");
      expect(rules(`<FujiProvider glassTint="light">x</FujiProvider>`)).toContain("removed-api");
    });

    it("every appearance prop on a tag, not just the first", () => {
      expect(rules(`<Card theme="dark" elevation="high" />`)).toEqual([
        "provider-owned-appearance",
        "provider-owned-appearance",
      ]);
    });

    it("both a controlled and an uncontrolled prop", () => {
      expect(rules(`<Input value={name} defaultValue="Ada" onChange={set} />`)).toContain(
        "value-defaultvalue",
      );
    });

    it("an overlay given both open and defaultOpen", () => {
      expect(rules(`<Dialog open={isOpen} defaultOpen />`)).toContain("value-defaultvalue");
    });

    it("an async default-exported page using dot-access", () => {
      // The most common Server Component of all imports nothing from next/.
      expect(
        rules(
          `import { Dialog } from "@fujiui/react";\nexport default async function Page() { return <Dialog><Dialog.Content /></Dialog>; }`,
        ),
      ).toContain("server-component-subparts");
    });

    it("a Fuji component imported under an alias", () => {
      expect(rules(`import { Card as FCard } from "@fujiui/react";\n<FCard theme="dark" />`)).toContain(
        "provider-owned-appearance",
      );
    });

    it("a violation the escaped-backslash bug used to hide", () => {
      // `findTagEnd` returned -1 and the whole element was silently dropped.
      expect(rules(`<Card title="C:\\\\Users\\\\" theme="dark" />`)).toContain("provider-owned-appearance");
    });

    it("a nested Fuji element on its own merits", () => {
      // Previously invisible: the parent swallowed it and nobody checked it.
      expect(rules(`<Card header={<Button size="medium">Save</Button>}>body</Card>`)).toContain(
        "allowed-values",
      );
    });

    it("a violation past two levels of brace nesting", () => {
      expect(rules(`<Card onClick={() => save({ a: { b: { c: 1 } } })} theme="dark" />`)).toContain(
        "provider-owned-appearance",
      );
    });

    it("an app entry that mounts the root without the stylesheet", () => {
      // Only the module that mounts the root is asked for the import; see the
      // split-layout case below for why "renders the provider" is not enough.
      expect(
        rules(
          `import { createRoot } from "react-dom/client";\nimport { FujiProvider } from "@fujiui/react";\ncreateRoot(el).render(<FujiProvider><App /></FujiProvider>);`,
        ),
      ).toContain("stylesheet-required");
    });
  });

  describe("the rules added last, checked for the false positives they invite", () => {
    it("accepts a controlled prop on its own", () => {
      expect(rules(`<Input value={name} onChange={set} />`)).toEqual([]);
    });

    it("accepts an uncontrolled prop on its own", () => {
      expect(rules(`<Input defaultValue="Ada" onChange={set} />`)).toEqual([]);
    });

    it("does not read defaultValue as value", () => {
      // `\svalue` must not match inside `defaultValue`, or every uncontrolled
      // input in the codebase reports as controlled-and-uncontrolled at once.
      expect(rules(`<Select defaultValue="a" items={items} />`)).toEqual([]);
    });

    it("accepts an app entry that does import the stylesheet", () => {
      expect(
        rules(
          `import { createRoot } from "react-dom/client";\nimport "@fujiui/react/styles.css";\nimport { FujiProvider } from "@fujiui/react";\ncreateRoot(el).render(<FujiProvider><App /></FujiProvider>);`,
        ),
      ).toEqual([]);
    });

    it("accepts a rendered element for an icon prop typed ReactNode", () => {
      // Seven of the ten props named `icon` take React.ReactNode, where an
      // element is the correct value. Flagging those told an agent to write
      // `icon={Home}`, which does not render.
      expect(rules(`<Sidebar.Item icon={<Home />} active>Home</Sidebar.Item>`)).toEqual([]);
    });

    it("does not judge a bare fragment as a Server Component", () => {
      // No imports, so there is no "use client" to be missing - this is a
      // snippet, and every documented example in the registry looks like it.
      expect(rules(`<Dialog><Dialog.Content /></Dialog>`)).toEqual([]);
    });

    it("does not ask a bare fragment for the stylesheet", () => {
      expect(rules(`<FujiProvider>\n  <App />\n</FujiProvider>`)).toEqual([]);
    });

    it("accepts a key template inside a list that has a className", () => {
      // The old rule accepted any class-ish word within 200 characters, so an
      // ordinary keyed list reported as rendering unstyled.
      expect(
        rules('<ul className="fuji-list">\n{items.map((i) => <li key={`row-${i.id}`}>{i.name}</li>)}\n</ul>'),
      ).toEqual([]);
    });

    it("accepts an id template beside a real class expression", () => {
      expect(
        rules('const cls = cn("mt-2", className);\n<Input id={`field-${id}`} className={cls} />'),
      ).toEqual([]);
    });

    it("does not call a Vite app's dot-access a Server Component", () => {
      // No framework with Server Components in sight. This repo's own
      // fixtures/plain-vite is exactly this file.
      expect(
        rules(
          `import { Dialog } from "@fujiui/react";\nexport const C = () => <Dialog><Dialog.Content>hi</Dialog.Content></Dialog>;`,
        ),
      ).toEqual([]);
    });

    it("does not read a nested element's props as its parent's", () => {
      expect(rules(`<Select renderOption={(o) => <Option value={o.id} />} defaultValue="a" />`)).toEqual([]);
      expect(rules(`<Card header={<ThemeToggle theme="dark" />}>body</Card>`)).toEqual([]);
    });

    it("survives an arrow function inside a nested element", () => {
      // The `>` of `=>` used to end the tag match early, so the nested
      // element's remaining props were glued onto the parent's list. A theme
      // toggle always has an onClick; a render prop's element usually does too.
      expect(
        rules(`<Card header={<ThemeToggle onClick={() => setT(t)} theme="dark" />}>body</Card>`),
      ).toEqual([]);
      expect(
        rules(
          `<Select renderOption={(o) => <Option onSelect={() => pick(o)} value={o.id} />} defaultValue="a" />`,
        ),
      ).toEqual([]);
    });

    it("does not blame a parent for a nested element's ReactNode icon", () => {
      // Rating.icon IS IconComponent, but the nested EmptyState.icon is
      // ReactNode, where an element is correct.
      expect(rules(`<Rating icon={Star} emptyLabel={<EmptyState icon={<Star />} />} />`)).toEqual([]);
    });

    it("does not read a destructured callback argument as a prop", () => {
      expect(rules(`<Combobox onValueChange={({ value }) => setV(value)} defaultValue="a" />`)).toEqual([]);
      expect(rules(`<Select items={items.map((i) => ({ value }))} defaultValue="a" />`)).toEqual([]);
    });

    it("accepts a wrapper forwarding both controlled and uncontrolled props", () => {
      // How SearchInput is built: exactly one is defined at runtime.
      expect(rules(`<Input value={value} defaultValue={defaultValue} onChange={onChange} />`)).toEqual([]);
    });

    it("does not ask a split app layout for the stylesheet", () => {
      // Vite puts the CSS in main.tsx and the provider in App.tsx; Next.js
      // splits them across layout.tsx and providers.tsx.
      expect(
        rules(
          `import { FujiProvider } from "@fujiui/react";\nexport default () => <FujiProvider><App /></FujiProvider>;`,
        ),
      ).toEqual([]);
    });

    it("does not treat a comment mentioning next/ as a Server Component", () => {
      expect(
        rules(
          `// see https://nextjs.org from "next/link"\nimport { Dialog } from "@fujiui/react";\nexport const C = () => <Dialog><Dialog.Content /></Dialog>;`,
        ),
      ).toEqual([]);
    });

    it("ignores JSX written in a comment, a JSDoc example or a string", () => {
      // This file used to flag ITSELF: a `<Card theme="dark">` in a comment and
      // an `<IconButton>` in a doc example both produced findings.
      expect(rules('// never write <Card theme="dark">\nconst x = 1;')).toEqual([]);
      expect(rules("/**\n * @example\n * <IconButton icon={X} />\n */\nconst y = 1;")).toEqual([]);
      expect(rules(`export const SNIPPET = '<Card theme="dark" />';`)).toEqual([]);
      expect(rules('const html = `<Card theme="dark" />`;')).toEqual([]);
    });

    it("ignores imports written in a comment or a string", () => {
      expect(
        rules(
          `// legacy: import { FujiButton } from "@fujiui/react";\nimport { Button } from "@fujiui/react";`,
        ),
      ).toEqual([]);
      expect(rules(`export const I = 'import { Buton } from "@fujiui/react";';`)).toEqual([]);
    });

    it("keeps quote parity across an escaped backslash", () => {
      // Looking one character behind read `\\\\` as an escape, so the string
      // never closed and the NEXT element's attributes were read as this one's.
      expect(rules(`<Input defaultValue="a\\\\" />\n<Input value="b > c" />`)).toEqual([]);
    });

    it("does not read a commented-out prop as a live one", () => {
      expect(rules(`<Button size="md" /* was size="medium" */ />`)).toEqual([]);
    });

    it("leaves other libraries alone even when the name collides", () => {
      // Select, Card, Tabs, Button are Radix / MUI / Chakra / Base UI names too,
      // and Base UI is this package's own runtime dependency.
      expect(
        rules(`import { Select } from "@radix-ui/react-select";\n<Select value="a" defaultValue="b" />`),
      ).toEqual([]);
      expect(rules(`import Card from "@mui/material/Card";\n<Card elevation="2" />`)).toEqual([]);
      expect(rules(`import { Button } from "./ui/button";\n<Button size="large" />`)).toEqual([]);
    });

    it("does not ask a component file for the stylesheet", () => {
      // The import belongs once, at the app root. Every other module that uses
      // a component legitimately has no stylesheet import of its own.
      expect(rules(`import { Button } from "@fujiui/react";\n<Button>Save</Button>`)).toEqual([]);
    });
  });

  it("suggests the real name for a near miss", () => {
    const [finding] = reviewUsage(`import { Buton } from "@fujiui/react";`, registry!);
    expect(finding?.fix).toContain("Button");
  });
});
