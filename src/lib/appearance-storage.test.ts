import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  buildAppearanceBootstrapScript,
  readStoredAppearance,
} from "./appearance-storage";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-fuji-theme");
  document.documentElement.removeAttribute("data-fuji-material");
  document.documentElement.removeAttribute("data-fuji-radius");
  document.documentElement.removeAttribute("data-fuji-elevation");
  document.documentElement.removeAttribute("data-fuji-boot");
});

/**
 * `buildAppearanceBootstrapScript` is public API, and its output goes into a
 * `<script>` body via `dangerouslySetInnerHTML` (docs/ssr.md). That makes its
 * argument the one place in this package where an unvalidated string reaches
 * the page as code.
 */
describe("buildAppearanceBootstrapScript", () => {
  it("emits the given appearance when it is valid", () => {
    const script = buildAppearanceBootstrapScript({
      theme: "dark",
      material: "glass",
      radius: "soft",
      elevation: "floating",
    });
    expect(script).toContain('var t="dark"');
    expect(script).toContain('m="glass"');
    expect(script).toContain('r="soft"');
    expect(script).toContain('e="floating"');
    expect(script).toContain(APPEARANCE_STORAGE_KEY);
  });

  it("cannot be made to emit markup", () => {
    // TypeScript rejects this literal; a value that arrived as `string` from a
    // cookie, a CMS field or a preview query param does not get that check.
    // `JSON.stringify` escapes quotes but not `</script`.
    const script = buildAppearanceBootstrapScript({
      theme: '</script><script>fetch("//evil")</script>' as never,
      material: "solid",
      radius: "cornered",
      elevation: "regular",
    });
    expect(script).not.toContain("</script");
    expect(script).toContain(`var t="${DEFAULT_APPEARANCE.theme}"`);
  });

  it("falls back per axis rather than wholesale", () => {
    // `material` is the axis this refactor introduces; an invalid value for
    // it must revert to its own default without touching the other three
    // (already-valid) axes.
    const script = buildAppearanceBootstrapScript({
      theme: "dark",
      material: "opaque" as never,
      radius: "cornered",
      elevation: "floating",
    });
    expect(script).toContain('t="dark"');
    expect(script).toContain(`m="${DEFAULT_APPEARANCE.material}"`);
    expect(script).toContain('r="cornered"');
    expect(script).toContain('e="floating"');
  });

  /**
   * Legacy coercion, part 1: the runtime branch this function emits. A
   * returning visitor's `localStorage` can still hold a pre-0.3
   * `{"theme":"glass"}` value (glass used to be a `theme`, not a
   * `material`), and this must resolve before first paint or the page flashes
   * solid then glass once React hydrates and re-reads the same key. Executing
   * the actual generated script - not just checking its source text - is the
   * only way to prove the runtime branch itself, not merely that the right
   * substring is present somewhere in the string.
   */
  it('the emitted script coerces a legacy {theme:"glass"} stored value to dark theme + glass material before paint', () => {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "glass", radius: "soft", elevation: "floating" }),
    );
    const script = buildAppearanceBootstrapScript(DEFAULT_APPEARANCE);

    // Test-only, never shipped. The executed string is the deterministic
    // output of this package's own `buildAppearanceBootstrapScript` fed a
    // hardcoded constant (`DEFAULT_APPEARANCE`) - no attacker- or
    // user-controlled value reaches this call. Exercising the real generated
    // bootstrap script (the exact string a <script> tag would run) is the
    // point of this test, not a stand-in re-implementation of its coercion
    // logic.
    new Function(script)();

    expect(document.documentElement).toHaveAttribute("data-fuji-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-fuji-material", "glass");
    expect(document.documentElement).toHaveAttribute("data-fuji-radius", "soft");
    expect(document.documentElement).toHaveAttribute("data-fuji-elevation", "floating");
  });
});

/**
 * `readStoredAppearance` is the post-mount counterpart to the bootstrap
 * script above - `FujiProvider`'s `persist` hydration effect calls it
 * directly (see FujiProvider.tsx).
 */
describe("readStoredAppearance", () => {
  it("returns nothing when storage is empty", () => {
    expect(readStoredAppearance()).toEqual({});
  });

  it("returns the stored appearance, material included, when every axis is valid", () => {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "dark", material: "glass", radius: "soft", elevation: "floating" }),
    );
    expect(readStoredAppearance()).toEqual({
      theme: "dark",
      material: "glass",
      radius: "soft",
      elevation: "floating",
    });
  });

  it("tolerates malformed JSON by returning nothing", () => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "{not json");
    expect(readStoredAppearance()).toEqual({});
  });

  /**
   * Legacy coercion, part 2: the reader. The deployed docs site has real
   * visitors with a pre-0.3 `{"theme":"glass"}` value already in
   * `localStorage`, and it never carried light/dark information (glass used
   * to overwrite that choice) - so this must land on `material:"glass"` with
   * `theme:"dark"` as the tone that material shipped with, not silently drop
   * to `light`/`solid`.
   */
  it('coerces a legacy {"theme":"glass"} stored value to theme "dark" + material "glass"', () => {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "glass", radius: "soft", elevation: "floating" }),
    );
    expect(readStoredAppearance()).toEqual({
      theme: "dark",
      material: "glass",
      radius: "soft",
      elevation: "floating",
    });
  });
});
