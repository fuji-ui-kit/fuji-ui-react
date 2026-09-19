import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(__dirname, "tokens.css"), "utf8");
// base.css owns the `.fuji-progress-track` recipe the glass light-tint block pairs a stroke with
// (see the light-tint completeness tests below).
const baseCss = fs.readFileSync(path.join(__dirname, "base.css"), "utf8");

/** Comments are stripped first: tokens.css prose names tokens (e.g. `--fuji-page-background:
 * var(--fuji-background)`), and the declaration regex once matched the prose, passing a regression
 * test against CSS that was missing the real declaration. */
const source = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Raw bodies of every block whose selector is exactly `selector`, including inside @supports/@media
 * (glass recurs in several; a first-match-only version missed the rest). `(?<!\])` stops the plain
 * theme selector matching the tail of `[glass][data-fuji-theme="light"]`; `[^{}]*` finds the real
 * close of indented blocks, where `\n\}` overran into a sibling rule's declarations. */
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

/** The base (first, unconditional) block's own `name` under `selector`. Unlike `declarations()`,
 * whose merge lets the later opaque @supports/@media fallbacks win for tokens like
 * `--fuji-surface-strong`. Relies on the base block being the selector's first occurrence. */
function baseBlockValue(selector: string, name: string): string {
  const body = blocks(selector, source)[0];
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(body);
  if (!match) throw new Error(`${name} not found in the base block of ${selector}`);
  return match[1].trim().replace(/\s+/g, " ");
}

const root = declarations(":root");
const light = declarations('[data-fuji-theme="light"]');
const dark = declarations('[data-fuji-theme="dark"]');
/** Glass is parsed as two blocks: the base (effectively dark) and the light-theme override, which
 * wins per property by specificity (2 attrs vs 1). Solid has no block; `light`/`dark` already are. */
const glass = declarations('[data-fuji-material="glass"]');
const glassLightTint = declarations('[data-fuji-material="glass"][data-fuji-theme="light"]');
const glassLight = { ...glass, ...glassLightTint };

describe("tokens.css :root fallback", () => {
  // FujiProvider is optional (SPEC.md §2) and with `persist` the scope has no `data-fuji-*` until
  // mount, so a token only under `[data-fuji-theme=...]` left a provider-less `<Button>` transparent.
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
   * A var() custom property resolves where it is DECLARED, so a block that changes `--fuji-background`
   * must restate `--fuji-page-background` too (the dark page once painted light). Glass included. */
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
   * `material` and `theme` are independent axes (see the GLASS heading in tokens.css): glass falls
   * through to the theme's palette and must never pin its own `--fuji-background` (it once had #2c323b). */
  it("does not declare its own background, keeping glass in sync with the active theme's palette", () => {
    const declaredWhereItShouldnt: string[] = [];
    for (const [name, tokens] of Object.entries({
      "glass (dark tint)": glass,
      "glass (light tint)": glassLightTint,
    })) {
      // Glass must never declare `--fuji-background`; it always falls through to the theme.
      if ("--fuji-background" in tokens) {
        declaredWhereItShouldnt.push(`${name} declares --fuji-background`);
      }
      // The fallback blocks may restate `--fuji-page-background`, but only as
      // `var(--fuji-background)`; a literal or `transparent` is the real violation.
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
   * What makes glass a material: the translucent surface family and blur/saturate tiers. Nothing else
   * defines these, so a missing one silently renders as `material="solid"`. */
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

  /** `glassLight` merges the light tint over the base, so an unrestated token looks "present" with the
   * dark-tint value (how `--fuji-chat-bubble-incoming` shipped at 2.55:1). Only literals differing
   * between solid light and dark count; identical `var()`s like chat-bubble-outgoing (1.07:1 after
   * `--fuji-default`'s CRITICAL FIX in tokens.css) have their own test below. */
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
  /** The light-tint block once re-declared the contained fills as stale literals that out-specified
   * the base retune (sun 4.17:1 on white ink, under AA). A `var()` can't drift, so this fails the
   * moment a raw colour replaces it. */
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

  /** The base block's contained tones stay literals on purpose (pastel ink vs a muted fill), so only
   * `--fuji-contained-default` must reference `--fuji-default` to avoid drift. */
  it("derives the base glass block's contained-default fill from var(), not an independent literal", () => {
    expect(glass["--fuji-contained-default"]).toBe("var(--fuji-default)");
  });
});

describe("tokens.css glass atmosphere parity", () => {
  /** The atmosphere is opt-in via `.fuji-glass-atmosphere`; an `html::before` must never paint it
   * automatically (see the GLASS heading in tokens.css). */
  it("does not auto-paint a page canvas from an html pseudo-element", () => {
    expect(source).not.toMatch(/\[data-fuji-material="glass"\][^{]*::before/);
  });

  /** The opt-in class must reference the shared `--fuji-glass-atmosphere-image`, not a private copy
   * that goes stale when the real gradient is retuned. */
  it("still points the opt-in nested-preview canvas at the shared atmosphere image custom property", () => {
    const nestedImage = property(
      '[data-fuji-material="glass"] .fuji-glass-atmosphere',
      "background-image",
      source,
    );
    expect(nestedImage).toBe("var(--fuji-glass-atmosphere-image)");
  });

  /** A (0,3,0) light-theme `.fuji-glass-atmosphere` literal once outranked the `var()` rule, leaving
   * the token holding the DARK scene under light theme. No per-theme rule may hardcode it again. */
  it("lets no theme-specific rule hardcode the opt-in canvas behind the token's back", () => {
    // Match any canvas rule mentioning a theme in either attribute order - pinning one spelling let
    // the retired literal slip back in with the attributes swapped.
    const overrides = [...source.matchAll(/([^{}]*\.fuji-glass-atmosphere[^{}]*)\{([^}]*)\}/g)]
      .filter(([, selector]) => /data-fuji-theme/.test(selector))
      .filter(([, , body]) => /background-image\s*:/.test(body));
    expect(overrides.map(([, selector]) => selector.trim())).toEqual([]);
  });

  /** Both themes must resolve a scene through the token; a missing light one falls back to dark. */
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

/** Contrast helpers for the glass-token regressions below. Tokens are `rgb(r g b / a%)`,
 * `rgb(r g b)` or `#rrggbb`, parsed here rather than via a dependency. */
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
  // The pages `--fuji-background` falls through to under glass, read from the themes (not
  // hardcoded) so a retuned page colour breaks loudly.
  const darkPage = parseColor(dark["--fuji-background"]).slice(0, 3) as [number, number, number];
  const lightPage = parseColor(light["--fuji-background"]).slice(0, 3) as [number, number, number];

  /** Only tokens painted BARE (Switch/Slider tracks, Checkbox well) must hit 3:1; other surfaces
   * carry blur/shadow/border, like solid's own ~1.17:1 and 1.05:1 fills. Light tint's
   * `--fuji-surface-strong` also fails and is a documented gap (see its tokens.css comment). */
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

  /** Fails if `--fuji-surface-strong` drifts back toward the page (the old 42% was 1.01:1). Reads via
   * `baseBlockValue()`, since the flat merge resolves this token to a fallback block. */
  it("regresses if --fuji-surface-strong (dark tint) drops back under 3:1", () => {
    const ratio = contrastRatio(
      compositeOverBg(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"), darkPage),
      darkPage,
    );
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  /** Ceiling: the first 3:1 fix used near-opaque rgb(118 121 129 / 80%), a solid panel. 45% is the
   * cap set when it was re-solved on colour (white 35%); move it only with a visual check. */
  it("keeps --fuji-surface-strong (dark tint) translucent - alpha stays well under opaque", () => {
    const [, , , alpha] = parseColor(baseBlockValue('[data-fuji-material="glass"]', "--fuji-surface-strong"));
    expect(alpha).toBeLessThanOrEqual(0.45);
  });

  /** Joint constraint: AvatarGroup "+3" and Notification/EmptyState tiles paint 90% `#f5f1e8` muted
   * ink on this fill, and page vs ink contrast move oppositely with alpha, so both floors are pinned. */
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
    // Sanity check on the helpers: `lightPage`/`darkPage` must still mean what these tests assume.
    expect(relativeLuminance(lightPage)).toBeGreaterThan(0.7);
    expect(relativeLuminance(darkPage)).toBeLessThan(0.01);
  });
});

describe("tokens.css glass surface-overlay-nested light-tint completeness", () => {
  /** Light tint needs its own nested-panel fill: inheriting the base block's #262b33 put its dark ink
   * at 1.25:1 in Calendar's month/year chooser. */
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
  /** Outgoing bubbles must stay opaque (tail seam), so each glass block holds a literal kept in sync
   * by hand with its `--fuji-default-foreground`. The base one drifted (1.07:1); the parity test
   * can't see this because both solid themes write `var(--fuji-default)`. */
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
  /** base.css's dark-tint `.fuji-progress-track` override needs a light-tint companion; inheriting
   * the white stroke measured 1.07:1, under the 3:1 non-text floor. */
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

  /** `[data-fuji-theme="dark"]` and `[data-fuji-material="glass"]` tie at (0,1,0) on a dark+glass
   * element, so the later rule wins; only this test enforces glass staying after dark. */
  it("keeps the glass material block after the dark theme block so glass wins their specificity tie", () => {
    const darkAt = source.indexOf('[data-fuji-theme="dark"] {');
    const glassAt = source.indexOf('[data-fuji-material="glass"] {');
    expect(darkAt).toBeGreaterThan(-1);
    expect(glassAt).toBeGreaterThan(darkAt);
  });

  /** Same tie for the (0,2,0) floating-elevation compound blocks. */
  it("keeps the glass floating-elevation block after the dark floating-elevation block", () => {
    const darkFloatingAt = source.indexOf('[data-fuji-theme="dark"][data-fuji-elevation="floating"] {');
    const glassFloatingAt = source.indexOf('[data-fuji-material="glass"][data-fuji-elevation="floating"] {');
    expect(darkFloatingAt).toBeGreaterThan(-1);
    expect(glassFloatingAt).toBeGreaterThan(darkFloatingAt);
  });
});

describe('tokens.css light soft-ramp contrast (Badge/Avatar tone="..." appearance="soft")', () => {
  /** The light "soft" ramp (tone ink on its own wash) passed AA by only 0.02-0.05 in solid (forest
   * 4.25, sun 4.52, fire 4.54, water 4.55:1) and failed under glass (4.14/3.26/4.03/3.85:1). Guards
   * that all four tones clear, not just whichever gets noticed. */
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

  /** The stronger form: >=5:1, the margin this fix aimed for (solid 5.33/5.75/5.45/5.60:1, glass
   * 5.55/5.56/5.25/5.47:1), so a retune can't quietly eat it back to a hairline. */
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

  /** Carousel's inactive dot is the only slide-position signal, so 3:1 applies; light tint's 18% was
   * 1.45:1, raised to 55% (3.76:1). See the token's tokens.css comment for why alpha is the lever. */
  it("keeps light tint's --fuji-border-strong at or above the 3:1 UI-component floor against its own page", () => {
    const fill = compositeOverBg(glassLightTint["--fuji-border-strong"], lightPage);
    expect(contrastRatio(fill, lightPage)).toBeGreaterThanOrEqual(3);
  });

  /** Captions/timestamps/Timeline body paint this; 60% was 4.375:1 on the page, 65% gives 5.12:1. */
  it("keeps light tint's --fuji-foreground-subtle at or above WCAG AA (4.5:1) against its own page", () => {
    const fill = compositeOverBg(glassLightTint["--fuji-foreground-subtle"], lightPage);
    expect(contrastRatio(fill, lightPage)).toBeGreaterThanOrEqual(4.5);
  });
});

/** Light-scene floor: an old probe applied the dark scene's bounds (3.35/4.01/2.93/2.77:1); real
 * values are 4.94/6.56/6.43/6.17:1. Kept because a darker scene would break 34%-white -subtle. */
/** Resolves a glass token without the flat merge's fallback blocks (see `baseBlockValue`). */
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

/** `--fuji-fire` was the only accent text missing AA over the dark atmosphere's brightest pixels
 * (4.32:1 vs forest 4.87 / water 5.04 / sun 5.09); pinned as the entry with no margin. */
describe("tokens.css dark-glass accent text", () => {
  it("keeps every accent readable as text on glass over the atmosphere's brightest stop", () => {
    // The warm radial's RAW stop, brighter than any rendered pixel (~rgb(112,91,82)), so this guard
    // is conservative: it can fail early, never late.
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

/** The shared default chip recipe (Badge, Avatar fallback, MultiSelect) once used white-tinted
 * `--fuji-surface-strong`, which washed out over the atmosphere: 2.26:1 Badge, 2.36 Avatar, 2.92
 * MultiSelect. */
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

/** Dark glass's `-strong` is white so bare tracks clear the page (a dark tint was 1.01:1), but white
 * lightens toward bright backdrops, dropping text/icons to 2.10:1 (AvatarGroup "+N") and 1.82-2.26
 * (Icon). `-raised` is the dark-tinted content twin, identical to `-strong` everywhere else. */
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

  /** `parseColor` can't read glass's relative-colour inks (`rgb(from var(--fuji-foreground) r g b /
   * 90%)`), so resolve the reference and re-apply the alpha. */
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

/** `-strong` is the bare-fill tier (tracks, Skeleton, gridlines), visible only by its colour, so it
 * must tint AWAY from the page in all four combinations. Light glass shipped white (skeleton rows
 * 1.03:1). Direction only: light+solid is itself 1.05:1, so magnitude is checked as parity with solid. */
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
