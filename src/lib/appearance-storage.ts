import type { FujiElevation, FujiMaterial, FujiRadius, FujiTheme } from "../types";

/**
 * One persisted appearance preference (theme + material + radius + elevation)
 * so a selection survives client navigation, opening an example in a new tab,
 * and refresh. Storage access is wrapped so unavailable/blocked storage
 * (private mode, disabled cookies) never breaks rendering.
 */
export const APPEARANCE_STORAGE_KEY = "fuji-appearance";

export interface StoredAppearance {
  theme: FujiTheme;
  material: FujiMaterial;
  radius: FujiRadius;
  elevation: FujiElevation;
}

const THEMES: readonly FujiTheme[] = ["light", "dark"];
const MATERIALS: readonly FujiMaterial[] = ["solid", "glass"];
const RADII: readonly FujiRadius[] = ["cornered", "soft"];
const ELEVATIONS: readonly FujiElevation[] = ["regular", "floating"];

/**
 * The literal defaults the root layout boots with, fed into the pre-paint
 * appearance bootstrap script rendered in `layout.tsx`.
 */
export const DEFAULT_APPEARANCE: StoredAppearance = {
  theme: "light",
  material: "solid",
  radius: "cornered",
  elevation: "regular",
};

function coerce<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Read the persisted appearance, tolerating malformed or absent storage. */
export function readStoredAppearance(): Partial<StoredAppearance> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Legacy shape from before the theme/material split (package <=0.2.x),
    // where `"glass"` was a real `theme` value: `{"theme":"glass",...}`.
    // The deployed docs site has real visitors with exactly this value in
    // `localStorage`, and it never carried light/dark information (glass
    // used to overwrite that choice), so coercing it must not silently drop
    // to `light`/`solid` - it must land on the material that was actually in
    // effect, `glass`, with `dark` as the tone that material shipped with.
    if (parsed.theme === "glass") {
      return {
        theme: "dark",
        material: "glass",
        radius: coerce(parsed.radius, RADII),
        elevation: coerce(parsed.elevation, ELEVATIONS),
      };
    }
    return {
      theme: coerce(parsed.theme, THEMES),
      material: coerce(parsed.material, MATERIALS),
      radius: coerce(parsed.radius, RADII),
      elevation: coerce(parsed.elevation, ELEVATIONS),
    };
  } catch {
    return {};
  }
}

/** Persist the full appearance preference; silently no-ops when storage is unavailable. */
export function writeStoredAppearance(appearance: StoredAppearance): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Ignore quota/security errors - appearance still works for this session.
  }
}

/**
 * Inline script that stamps the persisted appearance onto `<html>` before the
 * first paint so the page never flashes the default theme. Kept dependency-free
 * and defensive so a storage error cannot throw during hydration setup.
 *
 * `<html>` also carries a `data-fuji-boot` marker from the server (see
 * layout.tsx) purely so a CSS rule can suppress color transitions while it's
 * present - swapping the SSR default attributes for the real persisted ones
 * still changes several elements' computed border/background/text colors,
 * and many of those elements (the header, `.fuji-theme-scope`, etc.) already
 * carry their own `transition-colors`-style utility for genuine, later,
 * user-driven theme switches. Without suppressing it here, that same
 * transition also plays across this initial swap, animating from the
 * server's default color to the persisted one - a real, if brief, visible
 * flash whenever the persisted appearance differs from the default. The
 * `finally` guarantees the marker is removed (transitions restored) even if
 * something above throws, so a storage error can never leave transitions
 * permanently disabled.
 */
export function buildAppearanceBootstrapScript(defaults: StoredAppearance): string {
  // Validated, not trusted. The result goes into a `<script>` body via
  // `dangerouslySetInnerHTML` (see docs/ssr.md), and `JSON.stringify` escapes
  // quotes but not `</script`. TypeScript stops a bad literal; it does not stop
  // a value that arrived as `string` from a cookie, a CMS field or a preview
  // query param. Coercing against the same lists the emitted script uses means
  // only these eight strings can ever reach the page.
  const theme = coerce(defaults.theme, THEMES) ?? DEFAULT_APPEARANCE.theme;
  const material = coerce(defaults.material, MATERIALS) ?? DEFAULT_APPEARANCE.material;
  const radius = coerce(defaults.radius, RADII) ?? DEFAULT_APPEARANCE.radius;
  const elevation = coerce(defaults.elevation, ELEVATIONS) ?? DEFAULT_APPEARANCE.elevation;
  // The inline `if(p&&p.theme==="glass")` branch mirrors `readStoredAppearance`'s
  // legacy coercion (see the comment there): it must run here too, pre-paint,
  // or a returning visitor with an old `{"theme":"glass"}` value gets `solid`
  // painted first and then flashes to `glass` once the React tree hydrates
  // and re-reads the same key through the coercing reader.
  return `(function(){var d=document.documentElement;try{var t=${JSON.stringify(
    theme,
  )},m=${JSON.stringify(material)},r=${JSON.stringify(radius)},e=${JSON.stringify(
    elevation,
  )};try{var raw=window.localStorage.getItem(${JSON.stringify(
    APPEARANCE_STORAGE_KEY,
  )});if(raw){var p=JSON.parse(raw);if(p&&p.theme==="glass"){t="dark";m="glass";}else{if(p&&["light","dark"].indexOf(p.theme)>-1)t=p.theme;if(p&&["solid","glass"].indexOf(p.material)>-1)m=p.material;}if(p&&["cornered","soft"].indexOf(p.radius)>-1)r=p.radius;if(p&&["regular","floating"].indexOf(p.elevation)>-1)e=p.elevation;}}catch(_){}d.setAttribute("data-fuji-theme",t);d.setAttribute("data-fuji-material",m);d.setAttribute("data-fuji-radius",r);d.setAttribute("data-fuji-elevation",e);}finally{d.removeAttribute("data-fuji-boot");}})();`;
}
