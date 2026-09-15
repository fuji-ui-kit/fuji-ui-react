import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the two generated artifacts, `dist/props.json` and
 * `dist/registry.json`.
 *
 * Neither had a test, so every property the docs site and the MCP server rely
 * on - defaults read from source, allowed values, compound parts describing
 * their API - was one refactor away from regressing with the build still
 * exiting 0. These are the invariants that failed silently in review.
 *
 * Skipped rather than failed when `dist/` is absent: `npm test` runs before
 * `npm run build` in the CI order, and a test that demands build output would
 * make the suite unrunnable from a clean checkout.
 */
const DIST = path.join(__dirname, "..", "dist");
const has = (file: string) => fs.existsSync(path.join(DIST, file));
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(DIST, file), "utf8"));

describe.skipIf(!has("props.json"))("dist/props.json", () => {
  const props = read("props.json") as Record<
    string,
    { component: string; extends?: string; props: { name: string; default?: string; description?: string }[] }
  >;

  it("reads defaults from the source, not from prose", () => {
    const button = props.ButtonProps.props;
    expect(button.find((p) => p.name === "size")?.default).toBe('"md"');
    expect(button.find((p) => p.name === "ripple")?.default).toBe("true");
  });

  it("never scavenges English out of a JSDoc sentence", () => {
    // Asserts the SHAPE of a default, not membership of a stopword list. The
    // list version could only catch prose it had been told about, and duly
    // missed the next one: `(defaults to h3, its semantic role)` shipped a
    // default of `s to h3, its semantic role` on `CardTitleProps.as`.
    //
    // A default is a literal: quoted, backticked, numeric, a keyword, an empty
    // collection, or a bare identifier naming a constant. Nothing with
    // unquoted whitespace in it is a value.
    const literal =
      /^(?:"[^"]*"|'[^']*'|`[^`]*`|-?\d+(?:\.\d+)?|true|false|null|undefined|\[\]|\{\}|[A-Za-z_$][\w.$]*(?:\(\))?)$/;
    // The shape check alone cannot reject a single scavenged word: a bare
    // identifier is a legitimate default (`DEFAULT_FORMAT`, `document.body`),
    // and `to` is shaped exactly like one. The two checks cover different
    // halves, so both stay.
    const connectors = new Set(["to", "is", "the", "a", "an", "follow", "spinner", "of", "in", "on"]);
    const prose = Object.entries(props).flatMap(([table, entry]) =>
      entry.props
        .filter((p) => p.default !== undefined && (!literal.test(p.default) || connectors.has(p.default)))
        .map((p) => `${table}.${p.name} = ${JSON.stringify(p.default)}`),
    );
    expect(prose).toEqual([]);
  });

  it("documents every prop it reports", () => {
    const undocumented = Object.entries(props).flatMap(([table, entry]) =>
      entry.props.filter((p) => !p.description).map((p) => `${table}.${p.name}`),
    );
    expect(undocumented).toEqual([]);
  });

  it("keeps a table whose props are entirely inherited, and says where from", () => {
    expect(props.FormFieldRootProps.props).toEqual([]);
    expect(props.FormFieldRootProps.extends).toMatch(/Field\.Root/);
  });
});

describe.skipIf(!has("registry.json"))("dist/registry.json", () => {
  const registry = read("registry.json");

  it("lists every public export, not just the catalogued components", () => {
    // The MCP server's "is this import real?" check reads this. Answering it
    // from `components` reported correct imports as hallucinated.
    for (const name of ["DialogRoot", "TabsRoot", "APPEARANCE_STORAGE_KEY"]) {
      expect(registry.exports.values).toContain(name);
    }
    for (const name of ["SelectItem", "TreeNode", "DataTableColumn", "ButtonProps"]) {
      expect(registry.exports.types).toContain(name);
    }
    expect(registry.exports.values.length).toBeGreaterThan(registry.components.length);
  });

  it("gives a union-typed prop its allowed values", () => {
    const button = registry.components.find((c: { name: string }) => c.name === "Button");
    expect(button.props.find((p: { name: string }) => p.name === "size").values).toEqual(["sm", "md", "lg"]);
    expect(registry.types.ComponentAppearance.values).toContain("bordered");
  });

  it("describes every compound part's API", () => {
    // A part that wraps a Base UI primitive has no props of its own. Emitting
    // an empty list and nothing else reads as "takes no props", which is the
    // one thing that is certainly untrue.
    const silent = registry.components.flatMap(
      (component: {
        name: string;
        parts?: { items: { name: string; props: unknown[]; extends?: string }[] };
      }) =>
        (component.parts?.items ?? [])
          .filter((part) => !part.props.length && !part.extends)
          .map((part) => `${component.name}.${part.name}`),
    );
    expect(silent).toEqual([]);
  });

  it("keeps the listing shape far cheaper than the full component array", () => {
    // The whole reason `index` exists. If this ratio collapses, a listing tool
    // is about to start costing ~47k tokens to answer "what components exist".
    const full = JSON.stringify(registry.components).length;
    const index = JSON.stringify(registry.index).length;
    expect(index * 5).toBeLessThan(full);
    expect(registry.index).toHaveLength(registry.components.length);
  });

  it("reports guide sizes in bytes", () => {
    for (const guide of registry.guides) {
      const real = fs.statSync(path.join(__dirname, "..", guide.path)).size;
      expect(guide.bytes).toBe(real);
    }
  });
});
