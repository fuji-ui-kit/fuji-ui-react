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
 * Public API whose output lands in a `<script>` body via `dangerouslySetInnerHTML` (docs/ssr.md) -
 * the one place in this package where an unvalidated string reaches the page as code.
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
    // TypeScript rejects this literal, but a `string` from a cookie/CMS/query param does not get
    // that check, and `JSON.stringify` escapes quotes but not `</script`.
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
    // An invalid `material` must revert to its own default without touching the other three
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
   * Legacy coercion, part 1: a pre-0.3 `{"theme":"glass"}` must resolve before first paint or the
   * page flashes solid then glass on hydration. Runs the real script, not a source-text check.
   */
  it('the emitted script coerces a legacy {theme:"glass"} stored value to dark theme + glass material before paint', () => {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "glass", radius: "soft", elevation: "floating" }),
    );
    const script = buildAppearanceBootstrapScript(DEFAULT_APPEARANCE);

    // Test-only: runs this package's own deterministic script output for a hardcoded constant (no
    // user-controlled input) - executing the real generated script is the point of this test.
    new Function(script)();

    expect(document.documentElement).toHaveAttribute("data-fuji-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-fuji-material", "glass");
    expect(document.documentElement).toHaveAttribute("data-fuji-radius", "soft");
    expect(document.documentElement).toHaveAttribute("data-fuji-elevation", "floating");
  });
});

/**
 * `readStoredAppearance` is the bootstrap script's post-mount counterpart, called by
 * `FujiProvider`'s `persist` hydration effect.
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
   * Legacy coercion, part 2: a pre-0.3 `{"theme":"glass"}` carried no light/dark choice, so it lands
   * on `material:"glass"` + `theme:"dark"` (the tone it shipped with), not `light`/`solid`.
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
