import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(__dirname, "tokens.css"), "utf8");
// base.css owns the `.fuji-progress-track` recipe that tokens.css's glass
// block has to pair a light-tint stroke with - see the light-tint
// completeness describe block below.
const baseCss = fs.readFileSync(path.join(__dirname, "base.css"), "utf8");

/**
 * Comments are stripped before anything is parsed. tokens.css explains itself
 * heavily, and those explanations name tokens - `--fuji-page-background:
 * var(--fuji-background)` appears in prose describing why that line exists.
 * The declaration regex below happily matched the prose copy and reported the
 * token as declared, which made this file's own regression test pass against
 * CSS that was missing the declaration entirely. Verified by reintroducing
 * the bug and watching the test go red.
 */
const source = css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * All raw block bodies (in source order) whose opening selector is exactly
 * `selector`, wherever they appear in `inSource` - including nested inside
 * `@supports`/`@media` conditions. A selector like
 * `[data-fuji-material="glass"]` legitimately recurs across several blocks
 * (the main palette, the keycap tokens, the no-backdrop-filter fallback, the
 * `prefers-reduced-transparency` fallback), and each can declare tokens the
 * others don't. A non-global match here used to capture only the FIRST such
 * block, which made every caller blind to anything declared in the rest -
 * verified by pasting `--fuji-background: #2c323b;` into a copy of the third
 * glass block (the no-backdrop-filter fallback) and watching the "does not
 * declare its own background" test below stay green.
 *
 * The leading `(?<!\])` matters since the glass light-tint block was rekeyed
 * from its own dedicated tint attribute to plain
 * `[data-fuji-theme="light"]` (glassTint is retired - the tint now always
 * equals theme): `[data-fuji-material="glass"][data-fuji-theme="light"] {`
 * ends in the exact text `[data-fuji-theme="light"] {`, which a selector
 * search for the plain theme block `[data-fuji-theme="light"]` would
 * otherwise match too, silently merging the glass block's OWN declarations
 * (its dark ink, its translucent surfaces) into what `declarations('[data-
 * fuji-theme="light"]')` reports as "the light theme" below. CSS compound
 * selectors chain attribute selectors wall-to-wall - no whitespace between
 * `]` and the next `[` - so a real selector boundary is never immediately
 * preceded by `]`; only a same-selector match glued onto a longer compound
 * one is. Verified by removing the lookbehind and watching `--fuji-default`
 * (glass's own `rgb(22 24 27 / 92%)`) show up as "the light theme's"
 * `--fuji-default` instead of light theme's own opaque `#181817`.
 *
 * The body capture is `[^{}]*`, not `.*?\n\}`: every block this file parses
 * is flat (property:value pairs only, no nested rule), so the first `}` is
 * always the real close - but the fallback blocks inside `@supports`/
 * `@media` (the no-backdrop-filter and `prefers-reduced-transparency` glass
 * fallbacks) are indented, and `\n\}` requires the closing brace at column
 * 0. Against an indented block that pattern skips straight past the real
 * close and keeps matching until it finds an unindented `}` - the
 * *wrapper's* close - silently pulling a SIBLING rule's declarations (e.g.
 * the light-tint compound selector immediately below it in the same
 * `@media`) into this selector's body too, with `declarations()`'s "last
 * match wins" then letting that sibling's value win outright. Concretely:
 * `glass["--fuji-surface-strong"]` resolved to the reduced-transparency
 * fallback's LIGHT-tint literal (`#f6f7f9`) regardless of what the base,
 * unconditional block declared - verified by editing a copy of tokens.css
 * to change only the base block's `--fuji-surface-strong` and confirming
 * `declarations('[data-fuji-material="glass"]')["--fuji-surface-strong"]`
 * did not move. Every regression guard below that reads a token off
 * `glass`/`glassLightTint` was at risk of silently checking the wrong
 * value for any token redeclared inside these indented fallback blocks.
 * `[^{}]*` stops at the real closing brace regardless of indentation, since
 * none of these declaration blocks ever contains a literal `{`/`}`.
 */
function blocks(selector: string, inSource: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<!\\])${escaped}\\s*\\{([^{}]*)\\}`, "gs");
  const out: string[] = [];
  for (const match of inSource.matchAll(re)) {
    out.push(match[1]);
  }
  if (out.length === 0) throw new Error(`selector not found: ${selector}`);
  return out;
}

/** Every `--fuji-*` custom property declared anywhere under `selector`,
 * merged across all of its blocks (later blocks win per property, matching
 * how equal-specificity rules cascade in source order). */
function declarations(selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const body of blocks(selector, source)) {
    for (const [, name, value] of body.matchAll(/(--fuji-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      out[name] = value.trim().replace(/\s+/g, " ");
    }
  }
  return out;
}

/** A single, non-custom-property (e.g. `background-image`) pulled out of
 * `selector`'s block(s) - used for the glass atmosphere parity check. When a
 * selector recurs across several blocks, the last block that declares `name`
 * wins, same as `declarations()`. */
function property(selector: string, name: string, inSource: string): string {
  const propertyBlocks = blocks(selector, inSource);
  for (let i = propertyBlocks.length - 1; i >= 0; i--) {
    const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(propertyBlocks[i]);
    if (match) return match[1].trim().replace(/\s+/g, " ");
  }
  throw new Error(`property ${name} not found in ${selector}`);
}

/**
 * The FIRST (base, unconditional) block's own value for `name` under
 * `selector` - deliberately NOT `declarations()`'s flattened, "last block in
 * the file wins" merge. `[data-fuji-material="glass"]` recurs in two
 * fallback contexts besides the main palette block: `@supports not
 * (backdrop-filter)` and `@media (prefers-reduced-transparency: reduce)`,
 * both near the end of the file, both deliberately opaque by design (see
 * their own comments in tokens.css) - real alternate paintings for real
 * conditions, not a continuation of the normal glass experience. A handful
 * of tokens (`--fuji-surface-strong` among them) are redeclared in ALL of
 * these blocks, so `declarations()`'s flat merge resolves them to whichever
 * block is physically LAST in the file - the `prefers-reduced-transparency`
 * fallback - regardless of what the base block says. That silently defeats
 * any test that means to check the normal (non-fallback) translucent value:
 * verified by editing a copy of tokens.css to change only the base block's
 * `--fuji-surface-strong` and confirming `declarations('[data-fuji-material=
 * "glass"]')["--fuji-surface-strong"]` did not move, while this function's
 * return value did. The base block is always `blocks(...)[0]` because it is
 * always the first physical occurrence of the selector in the file (the
 * `@supports`/`@media` fallbacks are appended near the end) - not enforced
 * here, just true of tokens.css's current layout; the "keeps the glass
 * material block after the dark theme block" ordering test elsewhere in
 * this file would need a sibling if that ever became load-bearing here too.
 */
function baseBlockValue(selector: string, name: string): string {
  const body = blocks(selector, source)[0];
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(body);
  if (!match) throw new Error(`${name} not found in the base block of ${selector}`);
  return match[1].trim().replace(/\s+/g, " ");
}

const root = declarations(":root");
const light = declarations('[data-fuji-theme="light"]');
const dark = declarations('[data-fuji-theme="dark"]');
/**
 * `material` has no CSS block for its `"solid"` value - solid is simply the
 * absence of a material override, so `light`/`dark` above already ARE
 * "light, solid" and "dark, solid". Only glass needs parsing, and it needs
 * two blocks: the base (effectively dark-theme) declarations, plus the
 * light-theme override that layers on top of it via a MORE specific selector
 * (2 attrs vs 1). `glassTint` is retired - the tint now always equals
 * `theme`, so the override is keyed on `[data-fuji-theme="light"]` directly
 * rather than a separate dedicated tint attribute. A real
 * `material="glass" theme="light"` element resolves each custom property
 * from whichever of the two blocks declares it with the higher specificity
 * (falling through to the base block for anything the light override
 * doesn't touch), so merging the light override over the base here
 * reproduces that per-property cascade for checks that need "the effective
 * light-theme-glass declarations".
 */
const glass = declarations('[data-fuji-material="glass"]');
const glassLightTint = declarations('[data-fuji-material="glass"][data-fuji-theme="light"]');
const glassLight = { ...glass, ...glassLightTint };

describe("tokens.css :root fallback", () => {
  // `FujiProvider` is optional (SPEC.md §2) and, with `persist`, the scope
  // wrapper carries no `data-fuji-*` until after mount. Any token that only
  // exists under `[data-fuji-theme=...]` resolves to nothing in those cases,
  // so a provider-less `<Button>` painted transparent with inherited text
  // color instead of falling back to light.
  it("defines every token the light theme defines", () => {
    const missing = Object.keys(light).filter((token) => !(token in root));
    expect(missing).toEqual([]);
  });

  it("uses the same value as the light theme for every shared token", () => {
    const drift = Object.keys(light)
      .filter((token) => token in root && root[token] !== light[token])
      .map((token) => `${token}: root=${root[token]} light=${light[token]}`);
    expect(drift).toEqual([]);
  });
});

describe("tokens.css radius scopes", () => {
  // A nested provider (or a portal) switches radius by stamping
  // `data-fuji-radius` on its own scope. That only works for a value with a
  // selector of its own: cornered used to live on :root alone, so a cornered
  // scope inside a soft app matched no radius rule and inherited soft.
  const RADIUS_TOKENS = Object.keys(root).filter((token) => token.startsWith("--fuji-radius-"));

  it("declares every radius token in both the cornered and the soft block", () => {
    expect(RADIUS_TOKENS.length).toBeGreaterThan(0);
    for (const value of ["cornered", "soft"]) {
      const scope = declarations(`[data-fuji-radius="${value}"]`);
      expect(RADIUS_TOKENS.filter((token) => !(token in scope))).toEqual([]);
    }
  });

  it("keeps the cornered block in step with the :root default", () => {
    const cornered = declarations('[data-fuji-radius="cornered"]');
    expect(RADIUS_TOKENS.map((token) => `${token}: ${cornered[token]}`)).toEqual(
      RADIUS_TOKENS.map((token) => `${token}: ${root[token]}`),
    );
  });
});

describe("tokens.css theme x material parity", () => {
  /**
   * A custom property whose value is a `var()` is substituted where it is
   * DECLARED, not where it is used. So `:root { --fuji-page-background:
   * var(--fuji-background) }` resolves once against `:root`'s own (light)
   * `--fuji-background` and inherits that concrete color everywhere - a
   * theme or material block that changes `--fuji-background` does NOT change
   * `--fuji-page-background` unless it also restates it directly.
   *
   * This shipped once already: the dark theme painted its page on the light
   * background while every surface on it went dark, and nothing failed.
   * `material="glass"` is exactly as exposed to the same trap as a theme is -
   * it independently overrides `--fuji-background` et al - so it is checked
   * here too, in both its dark-tint (base block) and light-tint (merged)
   * forms.
   */
  it("restates every :root token that is defined in terms of another token, for both themes and both glass tints", () => {
    const derived = Object.keys(root).filter((token) => /var\(--fuji-/.test(root[token]));
    // If this is empty the test is vacuous; assert the pattern still exists.
    expect(derived.length).toBeGreaterThan(0);

    const variants: Record<string, Record<string, string>> = {
      light,
      dark,
      "glass (dark tint)": glass,
      "glass (light tint)": glassLight,
    };

    const missing: string[] = [];
    for (const [name, tokens] of Object.entries(variants)) {
      for (const token of derived) {
        // Only matters when the variant actually overrides something the
        // derived token's value depends on.
        const dependencies = [...root[token].matchAll(/var\((--fuji-[a-z0-9-]+)/g)].map((m) => m[1]);
        const overridesADependency = dependencies.some((dependency) => dependency in tokens);
        if (overridesADependency && !(token in tokens)) missing.push(`${name} is missing ${token}`);
      }
    }
    expect(missing).toEqual([]);
  });

  /**
   * The parity guarantee this test used to protect assumed glass was a full
   * replacement palette: "glass must not be missing a token either solid
   * theme defines" meant restating `--fuji-background`, `--fuji-foreground`,
   * every tone color - all of it. That is now exactly backwards. `material`
   * and `theme` are independent axes (see the GLASS heading in tokens.css) -
   * glass is meant to fall through to whichever theme is active for its
   * palette, and restating a palette token here would silently pin a third,
   * theme-independent color scheme again, which is the exact bug this file
   * was rewritten to fix (glass used to hardcode `--fuji-background: #2c323b`
   * in both themes, with `--fuji-page-background: transparent` alongside it
   * to let a decorative atmosphere show through instead). Verified by
   * pasting `--fuji-background: #2c323b;` into a copy of the glass block and
   * watching this go red.
   */
  it("does not declare its own background, keeping glass in sync with the active theme's palette", () => {
    const declaredWhereItShouldnt: string[] = [];
    for (const [name, tokens] of Object.entries({
      "glass (dark tint)": glass,
      "glass (light tint)": glassLightTint,
    })) {
      // No legitimate glass block ever has a reason to declare
      // `--fuji-background` itself - it must always fall through to
      // whichever theme is active.
      if ("--fuji-background" in tokens) {
        declaredWhereItShouldnt.push(`${name} declares --fuji-background`);
      }
      // `--fuji-page-background` IS legitimately restated by the
      // no-backdrop-filter and `prefers-reduced-transparency` fallback
      // blocks (see tokens.css), but only ever as `var(--fuji-background)` -
      // i.e. still explicitly falling through to the theme, not an
      // independent value. Anything else (a literal color, `transparent`,
      // as the old atmosphere-era bug had it) is the real violation.
      if (
        "--fuji-page-background" in tokens &&
        tokens["--fuji-page-background"] !== "var(--fuji-background)"
      ) {
        declaredWhereItShouldnt.push(
          `${name} declares --fuji-page-background as ${tokens["--fuji-page-background"]}`,
        );
      }
    }
    expect(declaredWhereItShouldnt).toEqual([]);
  });

  /**
   * The half of the old guarantee that is still true, aimed at the tokens
   * that actually make glass a material rather than a bare pass-through over
   * the active theme: the translucent surface family and the backdrop blur/
   * saturate tiers. Unlike a palette token, nothing else in the cascade
   * defines these - if glass stopped declaring one, a `.fuji-glass-surface`
   * would silently render with whatever it inherited (typically fully
   * opaque, or with no blur at all), indistinguishable from
   * `material="solid"`. Verified by deleting `--fuji-backdrop-blur: 14px;`
   * from a copy of the glass block and watching this go red.
   */
  it("still declares the full set of translucent surface and backdrop tokens that make glass a material", () => {
    const materialTokens = [
      "--fuji-background-subtle",
      "--fuji-surface-subtle",
      "--fuji-surface",
      "--fuji-surface-strong",
      "--fuji-surface-overlay",
      "--fuji-border",
      "--fuji-border-strong",
      "--fuji-backdrop-blur-subtle",
      "--fuji-backdrop-saturate-subtle",
      "--fuji-backdrop-blur",
      "--fuji-backdrop-saturate",
      "--fuji-backdrop-blur-strong",
      "--fuji-backdrop-saturate-strong",
      "--fuji-backdrop-blur-overlay",
      "--fuji-backdrop-saturate-overlay",
    ];
    const missing = materialTokens.filter((token) => !(token in glass));
    expect(missing).toEqual([]);
  });

  /**
   * The companion this parity check was missing: presence in `glassLight`
   * (above) isn't enough on its own, because `glassLight` is `glass` merged
   * UNDER `glassLightTint` - a token the light-tint block never restates
   * still shows up as "present", just with the base (dark-tint) block's
   * value. That is exactly how `--fuji-chat-bubble-incoming` shipped
   * illegible under light tint: dark tint's `#525a66` is correct paired with
   * dark tint's white foreground, but light tint flips `--fuji-foreground` to
   * dark ink two lines below it and never got its own bubble color, so light
   * tint silently inherited dark tint's answer - measured 2.55:1 live in
   * Storybook, far under WCAG AA's 4.5:1.
   *
   * A token only needs restating for THIS reason when its correct value
   * actually depends on which foreground it pairs with - i.e. when the solid
   * light and dark themes give it different literal values. (A token both
   * solid themes give the SAME value, or express as `var(--fuji-default)`
   * etc., doesn't have this problem BY THIS TEST'S DEFINITION - the filter
   * above compares `light[token]` and `dark[token]` as literal strings, and
   * `--fuji-chat-bubble-outgoing` writes the identical string
   * `var(--fuji-default)` in both, so it is (and stays) absent from
   * `themeSensitive` regardless of what that `var()` actually resolves to
   * per theme.
   *
   * That was, in fact, exactly the blind spot that let a real regression
   * ship: the glass base block's own `--fuji-chat-bubble-outgoing` used to
   * be a literal near-black that paired correctly with white ink under
   * BOTH glass tints (back when this block's own `--fuji-default` was also
   * a fixed near-black in both themes), so being absent from this list was
   * correct at the time. Once `--fuji-default` was fixed to invert with
   * theme (see its CRITICAL FIX comment in tokens.css) without updating
   * `--fuji-chat-bubble-outgoing` to match, dark ink landed on that same
   * stale near-black literal at 1.07:1 - and this test, which only ever
   * looks at `light`/`dark`, had no way to see it: the defect lived
   * entirely inside the glass blocks' own literals, never in a solid-theme
   * difference. Fixed in tokens.css and covered by its own dedicated test
   * below ("chat-bubble outgoing-fill glass completeness") rather than by
   * this one - broadening this filter to compare RESOLVED colors instead of
   * raw strings was considered and rejected: it would need to evaluate
   * `var()`/`rgb(from ...)` generally, which is a much bigger change to
   * this file's parsing for one token.)
   */
  it("restates, for light tint, every theme-sensitive token the glass base block also overrides", () => {
    const themeSensitive = Object.keys(light).filter(
      (token) => token in dark && light[token] !== dark[token],
    );
    // If this is empty the test is vacuous; assert the pattern still exists.
    expect(themeSensitive.length).toBeGreaterThan(0);

    const missing = themeSensitive.filter((token) => token in glass && !(token in glassLightTint));
    expect(missing).toEqual([]);
  });
});

describe("tokens.css glass contained-tone duplication guard", () => {
  /**
   * Regression guard for a HIGH-severity defect: `--fuji-contained-sun/-fire/
   * -water` were retuned in the base (dark-tint) block, but the light-tint
   * block independently re-declared all four `contained-forest/-sun/-fire/
   * -water` tokens with its own pre-retune literals - being the MORE
   * specific selector ([data-fuji-theme="light"] added), those stale values
   * silently won for every real light+glass element, and the base block's
   * retune never actually took effect there. Measured live in
   * `inputs-button--tones`, light theme: sun's stale fill read 4.17:1
   * against white ink, under WCAG AA's 4.5:1 - forest/fire/water's equally
   * stale fills happened to still clear it, by luck, not by design.
   *
   * Fixed by making the light-tint block's forest/sun/fire/water/default
   * contained fills `var()` references to this block's own already-correct
   * plain tone tokens instead of independent hardcoded literals - see the
   * comments on `--fuji-contained-default` and `--fuji-contained-forest` in
   * tokens.css for why that's possible here (and deliberately NOT done for
   * the base block's own contained-forest/-sun/-fire/-water, which stay
   * independent literals for a real reason of their own). A `var()`
   * reference cannot drift out of sync with what it points to - there is
   * only one number to change. This guard is what would have caught the
   * original defect: it fails the instant a raw color literal replaces the
   * `var()`, before that literal even has a chance to go stale relative to
   * a future retune elsewhere. Verified by pasting a literal (e.g. the old
   * `rgb(154 106 20 / 92%)`) into a copy of the light-tint block's
   * `--fuji-contained-sun` and watching this go red.
   */
  it("derives the light-tint glass block's contained-tone fills from var(), not independent literals", () => {
    const tones = ["default", "forest", "sun", "fire", "water"];
    const wrong = tones
      .map((tone) => {
        const token = `--fuji-contained-${tone}`;
        const expected = `var(--fuji-${tone})`;
        const actual = glassLightTint[token];
        return actual === expected
          ? null
          : `${token}: expected "${expected}", got "${actual ?? "(not declared)"}"`;
      })
      .filter((entry): entry is string => entry !== null);
    expect(wrong).toEqual([]);
  });

  /**
   * The base (dark-tint) block's own `--fuji-contained-forest/-sun/-fire/
   * -water` stay independent literals on purpose - the ink they'd otherwise
   * reference is a pastel meant for text, a genuinely different color from
   * the more muted, higher-alpha fill meant for a button (see the block's
   * own comment) - so only `--fuji-contained-default` is checked here: it
   * numerically coincides with `--fuji-default` in the base block for the
   * same "high-alpha fill dominates" reason it does in the light-tint block,
   * and referencing it instead of duplicating it closes the same drift risk.
   */
  it("derives the base glass block's contained-default fill from var(), not an independent literal", () => {
    expect(glass["--fuji-contained-default"]).toBe("var(--fuji-default)");
  });
});

describe("tokens.css glass atmosphere parity", () => {
  /**
   * `[data-fuji-material="glass"]:where(html)::before` used to paint the
   * atmosphere gradient onto the real document root automatically, the
   * instant `material="glass"` was set - glass creating its own decorative
   * backdrop rather than sitting on the active theme's, exactly what the
   * GLASS heading comment in tokens.css says not to do post-rewrite. The
   * canvas is opt-in now, via the `.fuji-glass-atmosphere` class (see the
   * next test); nothing should paint it automatically. Verified by pasting
   * `[data-fuji-material="glass"]:where(html)::before { background-image:
   * var(--fuji-glass-atmosphere-image); }` into a copy of tokens.css and
   * watching this go red.
   */
  it("does not auto-paint a page canvas from an html pseudo-element", () => {
    expect(source).not.toMatch(/\[data-fuji-material="glass"\][^{]*::before/);
  });

  /**
   * The opt-in replacement for the retired automatic canvas: nested/
   * side-by-side previews (the website's `ThemeShowcaseGrid`,
   * `DeviceShowcase`, `RadiusShowcase`) apply `.fuji-glass-atmosphere` to a
   * panel themselves. It still has to reference the shared
   * `--fuji-glass-atmosphere-image` custom property rather than a private
   * copy of the gradient, or a consumer applying the class gets a stale
   * gradient the moment the real one is retuned - the same drift this test
   * used to guard against when the automatic canvas still existed. Verified
   * by hardcoding a literal gradient in a copy of the `.fuji-glass-atmosphere`
   * rule in place of the `var(...)` and watching this go red.
   */
  it("still points the opt-in nested-preview canvas at the shared atmosphere image custom property", () => {
    const nestedImage = property(
      '[data-fuji-material="glass"] .fuji-glass-atmosphere',
      "background-image",
      source,
    );
    expect(nestedImage).toBe("var(--fuji-glass-atmosphere-image)");
  });

  /**
   * The light scene used to be a private literal inside
   * `[data-fuji-material="glass"][data-fuji-theme="light"] .fuji-glass-atmosphere`.
   * At (0,3,0) that rule outranked the (0,2,0) `var(...)` rule above, so it -
   * not the custom property - decided what light glass actually painted. The
   * class rendered correctly, which is why it went unnoticed, but
   * `--fuji-glass-atmosphere-image` still held the DARK scene under light
   * theme, and that token's own comment invites consumers to reference it for
   * their own backdrop: anyone who did got a dark scene under a light app.
   * It was precisely the "private copy drifts from the real one" failure the
   * test above exists to prevent, one specificity level out of its reach.
   *
   * The light scene now lives in the token like the dark one, so NO per-theme
   * rule may hardcode this background-image again. Verified by restoring the
   * old literal rule in a copy of tokens.css and watching this go red.
   */
  it("lets no theme-specific rule hardcode the opt-in canvas behind the token's back", () => {
    // Match ANY rule that targets the canvas and mentions a theme, in either
    // attribute order. `[glass][theme=light]` and `[theme=light][glass]` are
    // identical CSS, and pinning one spelling let the exact regression this
    // guard exists for slip through silently - verified by reintroducing the
    // retired literal with the attributes swapped and watching this stay green.
    const overrides = [...source.matchAll(/([^{}]*\.fuji-glass-atmosphere[^{}]*)\{([^}]*)\}/g)]
      .filter(([, selector]) => /data-fuji-theme/.test(selector))
      .filter(([, , body]) => /background-image\s*:/.test(body));
    expect(overrides.map(([, selector]) => selector.trim())).toEqual([]);
  });

  /**
   * Both themes must actually resolve a scene through that one token - a
   * missing light declaration would silently fall back to the dark one, which
   * is the bug that started this.
   */
  it("declares the atmosphere image for both themes on the token itself", () => {
    const dark = baseBlockValue('[data-fuji-material="glass"]', "--fuji-glass-atmosphere-image");
    const light = baseBlockValue(
      '[data-fuji-material="glass"][data-fuji-theme="light"]',
      "--fuji-glass-atmosphere-image",
    );
    expect(dark).toBeTruthy();
    expect(light).toBeTruthy();
    expect(light).not.toEqual(dark);
  });
});

/**
 * Real-color contrast helpers for the "glass surface tokens invisible on the
 * theme's own page" regression class below. Every glass surface/border token
 * this file declares is `rgb(r g b / a%)`, `rgb(r g b)`, or `#rrggbb` -
 * parsed here rather than pulled in as a dependency, since the whole point is
 * to catch the defect at the token-value level, in the same process that
 * already parses tokens.css above.
 */
function parseColor(value: string): [number, number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%\s*)?\)$/.exec(value);
  if (rgb) {
    const [, r, g, b, a] = rgb;
    return [Number(r), Number(g), Number(b), a === undefined ? 1 : Number(a) / 100];
  }
  throw new Error(`unparseable color: ${value}`);
}

/** Alpha-composite `value` (a token's own color) over an opaque `bg` (an
 * [r, g, b] page background), per the standard "source over" formula. */
function compositeOverBg(value: string, bg: [number, number, number]): [number, number, number] {
  const [r, g, b, a] = parseColor(value);
  return [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)];
}

/** WCAG relative luminance (sRGB, 0-255 channels in, 0-1 luminance out). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two already-opaque [r, g, b] colors. */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens.css glass surface contrast against the theme's own page", () => {
  // Dark theme's own #0f0f0e / light theme's own #eceae6 - the SAME two
  // page colors `--fuji-background` falls through to under glass (see the
  // GLASS heading: glass declares no page of its own any more). Read from
  // `dark`/`light` rather than hardcoded, so this test breaks loudly instead
  // of silently drifting if either theme's page color is ever retuned.
  const darkPage = parseColor(dark["--fuji-background"]).slice(0, 3) as [number, number, number];
  const lightPage = parseColor(light["--fuji-background"]).slice(0, 3) as [number, number, number];

  /**
   * Only the two tokens this pass actually fixed - not a blanket "every
   * glass surface/border token must hit 3:1" assertion. That blanket
   * assertion would be false to how this file's own components use these
   * tokens: `--fuji-surface`/`-subtle`/`-overlay` and the plain
   * `--fuji-border` are, in every real consumer (Card, Calendar, Dialog,
   * Drawer, Toast, ...), always painted alongside a real `backdrop-filter`
   * blur class, a `shadow-fuji-*`, and/or a `border-fuji-border` (Alert used
   * to be listed here too and is not: it carries `shadow-fuji-card` and
   * `border-fuji-border` but no `.fuji-glass-surface*` class at all, so it
   * never gets the blur - see the note in docs/theming.md about which
   * categories take the material) - DESIGN.md's own "surfaces are defined by shadow,
   * not by border" philosophy, which solid theme's equally-low fill-vs-page
   * numbers already rely on (measured live: solid dark `--fuji-surface`
   * #1e1e1c vs #0f0f0e is ~1.17:1, solid light `--fuji-surface-strong`
   * #e7e5e0 vs #eceae6 is 1.05:1 - neither is a glass defect, both are the
   * accepted baseline this whole system already ships).
   * `--fuji-surface-strong` and `--fuji-border-strong` are different: real
   * components (Switch's track, Slider's track/thumb-ring, Checkbox's well)
   * paint them BARE, with nothing else to carry the boundary - see the long
   * comment on `--fuji-surface-strong` in tokens.css for the measured
   * before/after. Light tint's own `--fuji-surface-strong` fails this same
   * check (see its own comment) and is deliberately NOT in this list - left
   * as a documented, pre-existing, non-regression finding rather than
   * silently asserted away.
   */
  const boundaryTokens = ["--fuji-surface-strong", "--fuji-border-strong"];

  it("keeps the dark-tint's bare-fill boundary tokens at or above the 3:1 UI-component floor against dark theme's own page", () => {
    const failures = boundaryTokens
      .map((token) => {
        const ratio = contrastRatio(
          compositeOverBg(baseBlockValue('[data-fuji-material="glass"]', token), darkPage),
          darkPage,
        );
        return { token, ratio };
      })
      .filter(({ ratio }) => ratio < 3);
    expect(failures).toEqual([]);
  });

  /**
   * The inverse of the guard above: fails loudly if a future retune quietly
   * regresses `--fuji-surface-strong` back toward the page (or past it, into
   * the atmosphere-tuned darker fills the -subtle/-default tiers still use)
   * without anyone re-running the Storybook measurement. Verified by
   * reverting `--fuji-surface-strong` to its old `rgb(12 14 18 / 42%)` in a
   * copy of tokens.css and watching this go red (1.01:1, not 1.00 exactly,
   * per the live-measured number in its own comment - both are the same
   * "effectively invisible" defect this guard exists to catch). Reads the
   * base block specifically via `baseBlockValue()`, not `glass[...]` - see
   * that helper's own comment for why the flattened merge resolves this
   * particular token to an unrelated fallback block's value instead.
   */
  it("regresses if --fuji-surface-strong (dark tint) drops back under 3:1", () => {
    const ratio = contrastRatio(
      compositeOverBg(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"), darkPage),
      darkPage,
    );
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  /**
   * The upper half of the same guard: the first attempt at the 3:1 fix
   * above cleared the floor by raising alpha (rgb(118 121 129 / 80%)) rather
   * than by lightening the colour, which happened to also solve the
   * page-boundary contrast but produced a fill within a few percent of
   * fully opaque - a material that reads as a solid panel with a blur
   * behind it, not something translucent. `--fuji-surface-strong` was
   * re-solved on colour (white, matching the family's own hairline border,
   * at rgb(255 255 255 / 35%)) specifically so it could clear the same
   * floor at under half that alpha. Nothing else stops a future contrast
   * fix from reaching for opacity again and quietly re-solidifying the
   * material the same way - this pins the ceiling so that regression fails
   * loudly instead of only showing up in a by-eye pass. 45% is the ceiling
   * called out when this was re-solved, not a hard physical limit; move it
   * only alongside a fresh visual check that the surface still reads as
   * glass. Verified by reverting to the shipped rgb(118 121 129 / 80%) in a
   * copy of tokens.css and watching this go red (80% alpha).
   */
  it("keeps --fuji-surface-strong (dark tint) translucent - alpha stays well under opaque", () => {
    const [, , , alpha] = parseColor(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"));
    expect(alpha).toBeLessThanOrEqual(0.45);
  });

  /**
   * The joint constraint the colour-based re-solve above had to satisfy
   * alongside the page-boundary floor, not after it: `AvatarGroup`'s
   * overflow count ("+3"), and the matching icon tiles on `Notification`
   * and `EmptyState`, paint `text-fuji-foreground-muted` directly on this
   * fill with no other background. `--fuji-foreground-muted` under the
   * dark tint is `rgb(from var(--fuji-foreground) r g b / 90%)` (see
   * tokens.css) - 90% alpha of whichever theme's `--fuji-foreground` is
   * active, which for dark+glass falls through to dark theme's own
   * `#f5f1e8`. Reconstructed here rather than parsed from the token, since
   * this suite's `parseColor` does not evaluate CSS relative-color syntax.
   * Page contrast and ink contrast move in opposite directions as this
   * fill's alpha rises, so a future change chasing more margin on one can
   * silently break the other; this guard is what makes that loud. Verified
   * by lowering `--fuji-surface-strong`'s alpha in a copy of tokens.css
   * until the page-boundary test above still passes at 3.0-3.1:1 while this
   * one drops under 4.5 - the two floors do not move together.
   */
  it("keeps the dark-tint's muted ink (AvatarGroup's '+3', Notification/EmptyState tiles) at or above 4.5:1 on --fuji-surface-strong", () => {
    const fill = compositeOverBg(
      baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"),
      darkPage,
    );
    const [r, g, b] = parseColor(dark["--fuji-foreground"]);
    const mutedInk = compositeOverBg(`rgb(${r} ${g} ${b} / 90%)`, fill);
    expect(contrastRatio(mutedInk, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps light theme's own page background high enough that this suite's math still models the reported defect", () => {
    // Sanity check on the helpers themselves, not the tokens: if this ever
    // fails, `lightPage`/`darkPage` above stopped meaning what the comments
    // here assume they mean.
    expect(relativeLuminance(lightPage)).toBeGreaterThan(0.7);
    expect(relativeLuminance(darkPage)).toBeLessThan(0.01);
  });
});

describe("tokens.css glass surface-overlay-nested light-tint completeness", () => {
  /**
   * `--fuji-surface-overlay-nested` (Calendar's month/year chooser) is
   * declared only in the base (dark-tint) block - see its own comment there.
   * Without a light-tint override it fell through to that dark-tint value
   * (`#262b33`, opaque navy chosen to back WHITE text) while the light tint's
   * own ink is dark (`--fuji-foreground: #16181b`) - measured live by opening
   * the chooser on `data-display-calendar--interactive-header` (light theme,
   * glass): dark ink on that dark panel was 1.25:1, effectively illegible.
   * The exact same shape of bug `--fuji-chat-bubble-incoming`'s own
   * completeness already guards against for a different token; this is that
   * same class of defect for this one. Verified by deleting the light-tint
   * override in a copy of tokens.css and watching this go red.
   */
  it("gives the nested overlay panel its own light-tint fill instead of silently inheriting the dark-tint's opaque navy", () => {
    expect(glassLightTint["--fuji-surface-overlay-nested"]).toBeDefined();
    expect(glassLightTint["--fuji-surface-overlay-nested"]).not.toBe(glass["--fuji-surface-overlay-nested"]);
  });

  it("keeps that light-tint fill legible against this tint's own dark ink", () => {
    const fill = parseColor(glassLightTint["--fuji-surface-overlay-nested"]).slice(0, 3) as [
      number,
      number,
      number,
    ];
    const ink = parseColor(glassLightTint["--fuji-foreground"]).slice(0, 3) as [number, number, number];
    expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("tokens.css chat-bubble outgoing-fill glass completeness", () => {
  /**
   * Regression guard for the contrast defect fixed alongside this test:
   * ChatBubble's outgoing bubble paints `fuji-chat-bubble-outgoing` under
   * `text-fuji-default-foreground` ink (see ChatBubble.tsx), and the fill
   * has to stay fully OPAQUE (a `var(--fuji-default)` reference would pull
   * in that token's translucency under glass, which reopens the tail-seam
   * bug `.fuji-chat-bubble-*`'s own comment in base.css describes) - so it
   * cannot simply track `--fuji-default` the way every other consumer of
   * `--fuji-default-foreground` does. Both glass blocks hold their own
   * opaque literal instead, and those literals have to be kept in sync BY
   * HAND with whichever ink each block's own `--fuji-default-foreground`
   * actually resolves to. They drifted out of sync once already: the base
   * (dark-tint) block's fill stayed the old near-black literal after
   * `--fuji-default` was fixed to invert with theme, landing dark ink on a
   * near-black fill at a measured 1.07:1. `tokens.css`'s own
   * `[data-fuji-material="glass"]` parity test above cannot catch this
   * class of defect - see its docstring - because both solid themes write
   * the identical string `var(--fuji-default)`, so this token never enters
   * that test's `themeSensitive` set no matter what the glass blocks do.
   */
  it("gives light tint its own outgoing-bubble fill instead of silently inheriting the dark tint's", () => {
    expect(glassLightTint["--fuji-chat-bubble-outgoing"]).toBeDefined();
    expect(glassLightTint["--fuji-chat-bubble-outgoing"]).not.toBe(glass["--fuji-chat-bubble-outgoing"]);
  });

  it("keeps the outgoing bubble fill fully opaque in both glass tints (opacity is not an available lever here)", () => {
    for (const tint of [glass, glassLightTint]) {
      const [, , , alpha] = parseColor(tint["--fuji-chat-bubble-outgoing"]);
      expect(alpha).toBe(1);
    }
  });

  it("keeps the dark-tint (base block) outgoing fill legible against its own --fuji-default-foreground ink", () => {
    const fill = parseColor(glass["--fuji-chat-bubble-outgoing"]).slice(0, 3) as [number, number, number];
    const ink = parseColor(glass["--fuji-default-foreground"]).slice(0, 3) as [number, number, number];
    expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the light-tint outgoing fill legible against its own --fuji-default-foreground ink", () => {
    const fill = parseColor(glassLightTint["--fuji-chat-bubble-outgoing"]).slice(0, 3) as [
      number,
      number,
      number,
    ];
    const ink = parseColor(glassLightTint["--fuji-default-foreground"]).slice(0, 3) as [
      number,
      number,
      number,
    ];
    expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("base.css progress-track glass light-tint completeness", () => {
  /**
   * `.fuji-progress-track` gets a dark-tint override in base.css
   * (`[data-fuji-material="glass"] .fuji-progress-track`) for the same reason
   * `.fuji-kbd-surface` and the keycap tokens get one in tokens.css: the
   * light/dark theme's own `--fuji-border-strong` doesn't survive the glass
   * atmosphere. That override never got a light-tint companion, so light
   * tint inherited the dark-tint white stroke - measured 1.07:1 against the
   * atmosphere on `foundation-circularprogress--default`, under the 3:1 floor
   * for non-text UI, effectively invisible.
   */
  it("gives the progress track its own light-tint stroke", () => {
    const baseSource = baseCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(baseSource).toMatch(
      /\[data-fuji-material="glass"\]\[data-fuji-theme="light"\]\s*\.fuji-progress-track\s*\{\s*stroke\s*:\s*[^;]+;/,
    );
  });
});

describe("tokens.css source order", () => {
  it("keeps the themed selectors after :root so they still win on equal specificity", () => {
    // `:root` and `[data-fuji-theme="dark"]` both have (0,1,0) specificity, so
    // source order is the only thing making the theme override the fallback.
    const rootAt = source.indexOf(":root {");
    for (const theme of ["light", "dark"]) {
      expect(source.indexOf(`[data-fuji-theme="${theme}"] {`)).toBeGreaterThan(rootAt);
    }
  });

  /**
   * Landmine from splitting `glass` out of `theme` into its own `material`
   * axis (see the GLASS heading comment in tokens.css). `theme` and
   * `material` are independent: an element can carry `data-fuji-theme="dark"
   * data-fuji-material="glass"` at once, and `[data-fuji-theme="dark"]` and
   * `[data-fuji-material="glass"]` are both single-attribute selectors -
   * identical (0,1,0) specificity - so both match it simultaneously. With
   * specificity tied, the LATER rule in the file wins per property, so the
   * glass block must stay physically after the dark block or a dark+glass
   * element would silently start resolving dark's colors instead of glass's.
   * This currently holds only because of file ordering, not because anything
   * else enforces it - reorder tokens.css and this is the only thing that
   * would catch it.
   */
  it("keeps the glass material block after the dark theme block so glass wins their specificity tie", () => {
    const darkAt = source.indexOf('[data-fuji-theme="dark"] {');
    const glassAt = source.indexOf('[data-fuji-material="glass"] {');
    expect(darkAt).toBeGreaterThan(-1);
    expect(glassAt).toBeGreaterThan(darkAt);
  });

  /**
   * The same tie, and the same fix, for the floating-elevation compound
   * blocks: `[data-fuji-theme="dark"][data-fuji-elevation="floating"]` and
   * `[data-fuji-material="glass"][data-fuji-elevation="floating"]` are both
   * (0,2,0), so a dark+glass+floating element resolves purely on source
   * order too.
   */
  it("keeps the glass floating-elevation block after the dark floating-elevation block", () => {
    const darkFloatingAt = source.indexOf('[data-fuji-theme="dark"][data-fuji-elevation="floating"] {');
    const glassFloatingAt = source.indexOf('[data-fuji-material="glass"][data-fuji-elevation="floating"] {');
    expect(darkFloatingAt).toBeGreaterThan(-1);
    expect(glassFloatingAt).toBeGreaterThan(darkFloatingAt);
  });
});

describe('tokens.css light soft-ramp contrast (Badge/Avatar tone="..." appearance="soft")', () => {
  /**
   * The light-mode "soft" tone ramp - `--fuji-{tone}` (ink) painted directly
   * on `--fuji-{tone}-soft` (its own translucent wash) - cleared WCAG AA by
   * only 0.02-0.05 in solid theme, and failed outright under glass. Measured
   * live: light+solid forest 4.25:1, sun 4.52:1, fire 4.54:1, water 4.55:1
   * (foundation-badge--tones / foundation-avatar--tones); light+glass forest
   * 4.14:1, sun 3.26:1, fire 4.03:1, water 3.85:1 (same stories, glass
   * material) - every tone under 4.5:1 there, sun by over a full point. A
   * rounding error in solid theme, an outright failure under glass - not a
   * margin either way.
   *
   * Both ramps were darkened (see the comments on the light theme block and
   * the light-tint glass block in tokens.css) to clear with real margin
   * instead of stopping at whichever tone the next person happens to
   * notice - this guard is what makes "someone fixes sun and leaves forest/
   * fire/water on a hairline" fail loudly instead of shipping quietly, the
   * same way the original defect did.
   */
  const tones = ["forest", "sun", "fire", "water"] as const;

  function softRampRatios(
    tokens: Record<string, string>,
    page: [number, number, number],
  ): Record<(typeof tones)[number], number> {
    return Object.fromEntries(
      tones.map((tone) => {
        const ink = parseColor(tokens[`--fuji-${tone}`]).slice(0, 3) as [number, number, number];
        const fill = compositeOverBg(tokens[`--fuji-${tone}-soft`], page);
        return [tone, contrastRatio(ink, fill)];
      }),
    ) as Record<(typeof tones)[number], number>;
  }

  const lightPage = parseColor(light["--fuji-background"]).slice(0, 3) as [number, number, number];

  it("clears WCAG AA (4.5:1) for every tone's ink against its own soft wash, light + solid", () => {
    const ratios = softRampRatios(light, lightPage);
    for (const tone of tones) {
      expect(ratios[tone], tone).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears WCAG AA (4.5:1) for every tone's ink against its own soft wash, light + glass", () => {
    const ratios = softRampRatios(glassLight, lightPage);
    for (const tone of tones) {
      expect(ratios[tone], tone).toBeGreaterThanOrEqual(4.5);
    }
  });

  /**
   * The stronger form of the same guard. 4.5:1 is the AA floor, but this
   * whole defect class was tones sitting at floor-plus-0.02–0.05: nominally
   * passing, actually a rounding error waiting to fail the moment the badge
   * lands on anything but the flattest possible page. Pins the real margin
   * this pass aimed for (>=5:1, re-measured: light+solid forest 5.33:1, sun
   * 5.75:1, fire 5.45:1, water 5.60:1; light+glass forest 5.55:1, sun
   * 5.56:1, fire 5.25:1, water 5.47:1) so a future retune has to notice if
   * it eats that margin back down to a hairline, even while the floor guard
   * above still nominally passes.
   */
  it("keeps every tone at or above 5:1 (not a hairline AA pass), light + solid", () => {
    const ratios = softRampRatios(light, lightPage);
    for (const tone of tones) {
      expect(ratios[tone], tone).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps every tone at or above 5:1 (not a hairline AA pass), light + glass", () => {
    const ratios = softRampRatios(glassLight, lightPage);
    for (const tone of tones) {
      expect(ratios[tone], tone).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("tokens.css light-tint glass border-strong / foreground-subtle contrast", () => {
  const lightPage = parseColor(light["--fuji-background"]).slice(0, 3) as [number, number, number];

  /**
   * Carousel's inactive pagination dot (`bg-fuji-border-strong`) is the only
   * signal of how many slides exist and which one is active, so the 3:1
   * non-text UI-component floor applies. The light tint's own
   * `--fuji-border-strong` (18% alpha of this tint's dark ink) measured
   * 1.45:1 against this tint's own page on `data-display-carousel--default`
   * - effectively invisible. Raised to 55% alpha (3.76:1) - see the token's
   * own comment in tokens.css for why alpha, not colour, is the lever here
   * (this ink is not part of the white-tinted surface family the "do not
   * raise opacity" constraint protects). Guards the fix from silently
   * regressing back under the floor.
   */
  it("keeps light tint's --fuji-border-strong at or above the 3:1 UI-component floor against its own page", () => {
    const fill = compositeOverBg(glassLightTint["--fuji-border-strong"], lightPage);
    expect(contrastRatio(fill, lightPage)).toBeGreaterThanOrEqual(3);
  });

  /**
   * Captions, timestamps, helper text, and Timeline's longer body copy all
   * paint `text-fuji-foreground-subtle`. The light tint's own value (60%
   * alpha of this tint's dark ink) measured 4.375:1 against this tint's own
   * page on `foundation-typography--variants` - under WCAG AA. Raised to
   * 65% alpha (5.12:1). Guards the fix from silently regressing back under
   * 4.5:1.
   */
  it("keeps light tint's --fuji-foreground-subtle at or above WCAG AA (4.5:1) against its own page", () => {
    const fill = compositeOverBg(glassLightTint["--fuji-foreground-subtle"], lightPage);
    expect(contrastRatio(fill, lightPage)).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * These pin the light scene's floor. They were originally written on a bad
 * premise - a contrast probe that hardcoded the DARK scene's bounds and applied
 * them to both themes, which made four light-theme pairings look like failures
 * (3.35 / 4.01 / 2.93 / 2.77:1). Against the scene light glass actually paints
 * they measure 4.94 / 6.56 / 6.43 / 6.17:1 and always did. The tests are kept
 * because the floor is a real constraint worth holding: `--fuji-surface-subtle`
 * is only 34% white, so a materially darker light scene WOULD break it, and
 * nothing else in this file would notice.
 */
/**
 * Resolve a token the way the real cascade does for glass, WITHOUT letting
 * `declarations()`'s flat merge pull in the `@supports`/`@media` fallback
 * blocks near the end of the file (see the note on `baseBlockValue`). Tokens
 * like `--fuji-surface` are redeclared in those blocks, so reading them off
 * the merged object silently measures the opaque reduced-transparency
 * painting instead of the translucent one. Most-specific base block first.
 */
function baseGlassValue(token: string, theme: "light" | "dark"): string {
  const scopes =
    theme === "light"
      ? ['[data-fuji-material="glass"][data-fuji-theme="light"]', '[data-fuji-material="glass"]']
      : ['[data-fuji-material="glass"]'];
  for (const scope of scopes) {
    try {
      return baseBlockValue(scope, token);
    } catch {
      /* not declared in this block - fall through to the next */
    }
  }
  const themed = theme === "light" ? light : dark;
  const value = themed[token] ?? root[token];
  if (!value) throw new Error(`${token} not resolvable for ${theme} glass`);
  return value;
}

describe("tokens.css light-glass atmosphere floor", () => {
  /** Relative luminance, WCAG 2.x. */
  function luminance([r, g, b]: [number, number, number]): number {
    const ch = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }

  /** Every colour stop in a gradient stack, as RGB. */
  function stops(image: string): [number, number, number][] {
    const out: [number, number, number][] = [];
    for (const match of image.matchAll(/rgba?\(([^)]+)\)|#([0-9a-fA-F]{6})/g)) {
      if (match[2]) {
        const n = parseInt(match[2], 16);
        out.push([(n >> 16) & 255, (n >> 8) & 255, n & 255]);
      } else {
        const p = match[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        out.push([p[0], p[1], p[2]]);
      }
    }
    return out;
  }

  /** The darkest pixel the atmosphere can present to a surface above it. */
  function darkestStop(selector: string): [number, number, number] {
    const all = stops(baseBlockValue(selector, "--fuji-glass-atmosphere-image"));
    expect(all.length).toBeGreaterThan(0);
    return all.reduce((a, b) => (luminance(a) <= luminance(b) ? a : b));
  }

  it("gives light glass its own atmosphere rather than inheriting the dark scene", () => {
    // The whole defect was one unqualified declaration serving both themes.
    const lightImage = baseBlockValue(
      '[data-fuji-material="glass"][data-fuji-theme="light"]',
      "--fuji-glass-atmosphere-image",
    );
    const darkImage = baseBlockValue('[data-fuji-material="glass"]', "--fuji-glass-atmosphere-image");
    expect(lightImage).not.toEqual(darkImage);
    // Light theme's floor must clear dark theme's ceiling, or it is not a
    // light scene - it is the same scene with different numbers.
    const lightFloor = luminance(darkestStop('[data-fuji-material="glass"][data-fuji-theme="light"]'));
    const darkStops = stops(darkImage).map((c) => luminance(c));
    expect(lightFloor).toBeGreaterThan(Math.max(...darkStops));
  });

  it("keeps every light-glass text pairing at AA over the atmosphere's darkest stop", () => {
    const floor = darkestStop('[data-fuji-material="glass"][data-fuji-theme="light"]');
    // The four pairings most sensitive to the scene's darkest point.
    // `--fuji-surface-subtle` + muted ink is the tightest: at 34% white it has
    // the least of its own opacity to fall back on, so it is the first to go if
    // the scene is ever darkened.
    const pairings: [string, string][] = [
      ["--fuji-surface", "--fuji-foreground-subtle"],
      ["--fuji-surface", "--fuji-foreground-muted"],
      ["--fuji-surface", "--fuji-water"],
      ["--fuji-surface-subtle", "--fuji-foreground-muted"],
    ];
    for (const [surfaceToken, inkToken] of pairings) {
      const surface = compositeOverBg(baseGlassValue(surfaceToken, "light"), floor);
      const ink = compositeOverBg(baseGlassValue(inkToken, "light"), surface);
      expect(
        contrastRatio(ink, surface),
        `${inkToken} on ${surfaceToken} over the atmosphere's darkest stop`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * `--fuji-fire` is the only one of the four accents used as TEXT on a glass
 * surface that missed AA over the dark atmosphere's brightest pixels (4.32:1,
 * against forest 4.87 / water 5.04 / sun 5.09). Pinned because the accent
 * ramp is tuned as a family and the fire entry is the one with no margin.
 */
describe("tokens.css dark-glass accent text", () => {
  it("keeps every accent readable as text on glass over the atmosphere's brightest stop", () => {
    // The warm radial's own stop colour. It is deliberately the RAW stop, not a
    // composited pixel: the radial paints at 78% over a darker linear, so a real
    // rendered pixel is never quite this bright (measured ~rgb(112,91,82)).
    // Over-stating the brightness makes this guard strictly conservative - it
    // can fail early, never late - which is what a floor should do.
    const brightest: [number, number, number] = [134, 100, 82];
    const surface = compositeOverBg(baseGlassValue("--fuji-surface", "dark"), brightest);
    for (const accent of ["--fuji-forest", "--fuji-sun", "--fuji-fire", "--fuji-water"]) {
      expect(
        contrastRatio(
          parseColor(baseGlassValue(accent, "dark")).slice(0, 3) as [number, number, number],
          surface,
        ),
        `${accent} as text on dark glass over the atmosphere's brightest stop`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * `softClasses("default")` is the chip recipe shared by Badge, Avatar's fallback
 * and MultiSelect's value chips. It used to borrow `--fuji-surface-strong`,
 * which under dark glass is a translucent WHITE fill (white so that bare,
 * textless fills like Switch/Slider/Progress tracks stay visible against a
 * near-black page - see its comment in tokens.css). White tint lightens toward
 * whatever is behind it, so over the atmosphere's warm pixels the chip washed
 * out and took its ink with it: 2.26:1 on Badge, 2.36 on Avatar, 2.92 on
 * MultiSelect. Verified by pointing the recipe back at `-strong` in a copy of
 * appearance.ts and watching this go red.
 */
describe("default-tone chip recipe", () => {
  const appearanceSource = fs.readFileSync(
    path.join(__dirname, "..", "components", "fuji", "lib", "appearance.ts"),
    "utf8",
  );

  /** The surface utility the `default` soft recipe paints. */
  function softDefaultSurface(): string {
    // Comments stripped first: the recipe carries a long rationale above it, and
    // a purely cosmetic `//` -> `/** */` reformat used to make this throw.
    const withoutComments = appearanceSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const recipe = /const SOFT_RECIPES[^{]*\{[^}]*?default:\s*"([^"]+)"/.exec(withoutComments);
    if (!recipe) throw new Error("could not read SOFT_RECIPES.default");
    const bg = /fj:bg-fuji-([a-z-]+)/.exec(recipe[1]);
    if (!bg) throw new Error(`no background utility in: ${recipe[1]}`);
    return `--fuji-${bg[1]}`;
  }

  it("does not paint the default chip on the white-tinted bare-fill surface", () => {
    expect(softDefaultSurface()).not.toBe("--fuji-surface-strong");
  });

  it("keeps the default chip's ink at AA over the dark scene, both extremes", () => {
    const surfaceToken = softDefaultSurface();
    // Brightest and darkest pixels of the shipped dark atmosphere.
    for (const scene of [
      [146, 104, 82],
      [35, 42, 53],
    ] as [number, number, number][]) {
      const fill = compositeOverBg(baseGlassValue(surfaceToken, "dark"), scene);
      const ink = compositeOverBg(baseGlassValue("--fuji-foreground", "dark"), fill);
      expect(contrastRatio(ink, fill), `default chip ink over rgb(${scene})`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * `--fuji-surface-raised` exists because `--fuji-surface-strong` cannot serve
 * two opposite needs at once. Under dark glass `-strong` is a translucent WHITE
 * fill, and deliberately so: bare, textless fills (Switch, Slider and Progress
 * tracks) have nothing but their own lightness to separate them from a
 * near-black page, and a dark tint put them at 1.01:1 against it. But white
 * LIGHTENS toward whatever is behind it, so every fill that carried TEXT or an
 * ICON lost contrast over a bright backdrop - 2.10:1 on AvatarGroup's "+N",
 * 1.82-2.26 on Icon's neutral tones. `-raised` is the content-bearing twin:
 * dark-tinted under dark glass, identical to `-strong` everywhere else.
 */
describe("tokens.css --fuji-surface-raised", () => {
  it("tints dark under dark glass, unlike the bare-fill surface it replaces", () => {
    const raised = parseColor(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-raised"));
    const strong = parseColor(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"));
    // The whole point: opposite tint directions.
    expect(strong[0]).toBeGreaterThan(200); // white-tinted
    expect(raised[0]).toBeLessThan(60); // dark-tinted
    // Still a material, not a solid panel.
    expect(raised[3]).toBeLessThan(0.6);
  });

  /**
   * Glass writes its muted/subtle inks in relative-colour syntax
   * (`rgb(from var(--fuji-foreground) r g b / 90%)`), which `parseColor` cannot
   * read. Resolve the reference and re-apply the alpha.
   */
  function resolveInk(token: string): string {
    const raw = baseGlassValue(token, "dark");
    const relative = /^rgb\(from\s+var\((--[\w-]+)\)\s+r\s+g\s+b\s*\/\s*([\d.]+)%\)$/.exec(raw);
    if (!relative) return raw;
    const [r, g, b] = parseColor(baseGlassValue(relative[1], "dark"));
    return `rgb(${r} ${g} ${b} / ${relative[2]}%)`;
  }

  it("carries both foreground and muted ink at AA over the dark scene, both extremes", () => {
    const fill = baseGlassValue("--fuji-surface-raised", "dark");
    for (const scene of [
      [146, 104, 82],
      [35, 42, 53],
    ] as [number, number, number][]) {
      const surface = compositeOverBg(fill, scene);
      for (const inkToken of ["--fuji-foreground", "--fuji-foreground-muted"]) {
        const ink = compositeOverBg(resolveInk(inkToken), surface);
        expect(
          contrastRatio(ink, surface),
          `${inkToken} on --fuji-surface-raised over rgb(${scene})`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("mirrors --fuji-surface-strong in every block except dark glass", () => {
    // Only the broken case may differ; a drift anywhere else would silently
    // restyle light theme or the solid materials.
    const raised = blocks('[data-fuji-theme="dark"]', source)[0];
    const strongDark = /--fuji-surface-strong:\s*([^;]+);/.exec(raised)?.[1].trim();
    const raisedDark = /--fuji-surface-raised:\s*([^;]+);/.exec(raised)?.[1].trim();
    expect(raisedDark).toBe(strongDark);
  });
});

/**
 * The rule that makes `--fuji-surface-strong` correct, stated once so it can
 * be checked in all four combinations instead of re-derived per block.
 *
 * `-strong` is the BARE-FILL tier: Switch/Slider/Progress tracks, Skeleton,
 * Image's placeholder, Chart's gridlines and loading bars. Those paint no
 * text, no border, no shadow and no blur, so the fill colour is the only
 * reason they are visible at all - which means it has to tint AWAY from the
 * page: darker in light theme, lighter in dark theme, in BOTH materials.
 *
 * Light glass had it backwards and nothing caught it, because every existing
 * guard in this file measures the dark tint. It shipped a white fill on a
 * white-ish surface: measured live on `data-display-datatable--loading`
 * (light, glass, atmosphere) the skeleton rows composited to rgb(254 253 253)
 * over the card's own rgb(251 250 249), i.e. 1.03:1 - a loading table that
 * looked like an empty one. Verified this test goes red by restoring
 * `rgb(255 255 255 / 68%)` in a copy of tokens.css.
 *
 * Direction only, deliberately: light+solid's own `#e7e5e0` is just 1.05:1
 * against the page, so a magnitude floor here would fail a pre-existing,
 * intentional characteristic of the light theme rather than the inversion
 * this guard exists to catch. The parity assertion below is the magnitude
 * half, and it is calibrated against solid rather than against a fixed
 * number, so the two materials cannot drift apart again.
 */
describe("tokens.css --fuji-surface-strong tint direction", () => {
  const lightPage = parseColor(light["--fuji-background"]).slice(0, 3) as [number, number, number];
  const darkPage = parseColor(dark["--fuji-background"]).slice(0, 3) as [number, number, number];

  // Glass keeps the active theme's own page - see docs/theming.md.
  const cases = [
    { name: "light + solid", value: () => light["--fuji-surface-strong"], page: lightPage, lighter: false },
    { name: "dark + solid", value: () => dark["--fuji-surface-strong"], page: darkPage, lighter: true },
    {
      name: "light + glass",
      value: () => baseGlassValue("--fuji-surface-strong", "light"),
      page: lightPage,
      lighter: false,
    },
    {
      name: "dark + glass",
      value: () => baseGlassValue("--fuji-surface-strong", "dark"),
      page: darkPage,
      lighter: true,
    },
  ];

  it.each(cases)("tints away from the page in $name", ({ value, page, lighter }) => {
    const fill = relativeLuminance(compositeOverBg(value(), page));
    const pageLum = relativeLuminance(page);
    if (lighter) expect(fill).toBeGreaterThan(pageLum);
    else expect(fill).toBeLessThan(pageLum);
  });

  it("keeps light glass at least as visible as light solid, so toggling material never hides a track", () => {
    const solid = contrastRatio(compositeOverBg(light["--fuji-surface-strong"], lightPage), lightPage);
    const glass = contrastRatio(
      compositeOverBg(baseGlassValue("--fuji-surface-strong", "light"), lightPage),
      lightPage,
    );
    expect(glass).toBeGreaterThanOrEqual(solid);
  });
});
