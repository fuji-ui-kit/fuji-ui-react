import type { FujiElevation, FujiMaterial, FujiRadius, FujiTheme } from "../types";

/**
 * Key for the one persisted appearance preference, so a selection survives navigation, new tabs
 * and refresh. Blocked storage (private mode, disabled cookies) never breaks rendering.
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

/** The literal defaults the root layout boots with, fed into the pre-paint bootstrap script. */
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
    // Legacy `{"theme":"glass"}` from <=0.2.x, still in real visitors' storage. It carried no
    // light/dark choice, so land on the material actually in effect (`glass`) with the `dark`
    // tone it shipped with, rather than silently dropping to `light`/`solid`.
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
 * Inline pre-paint script stamping the persisted appearance onto `<html>`. Its `finally` always
 * removes the server's `data-fuji-boot` (transition-suppressing) marker, even on a storage error.
 */
export function buildAppearanceBootstrapScript(defaults: StoredAppearance): string {
  // Validated, not trusted: this lands in a `<script>` body and `JSON.stringify` doesn't escape
  // `</script`. A value typed `string` from a cookie/CMS/query param bypasses TypeScript, so
  // coercing against the script's own lists means only these eight strings reach the page.
  const theme = coerce(defaults.theme, THEMES) ?? DEFAULT_APPEARANCE.theme;
  const material = coerce(defaults.material, MATERIALS) ?? DEFAULT_APPEARANCE.material;
  const radius = coerce(defaults.radius, RADII) ?? DEFAULT_APPEARANCE.radius;
  const elevation = coerce(defaults.elevation, ELEVATIONS) ?? DEFAULT_APPEARANCE.elevation;
  // The inline `p.theme==="glass"` branch mirrors `readStoredAppearance`'s legacy coercion;
  // without it pre-paint, an old value paints `solid` then flashes to `glass` on hydration.
  return `(function(){var d=document.documentElement;try{var t=${JSON.stringify(
    theme,
  )},m=${JSON.stringify(material)},r=${JSON.stringify(radius)},e=${JSON.stringify(
    elevation,
  )};try{var raw=window.localStorage.getItem(${JSON.stringify(
    APPEARANCE_STORAGE_KEY,
  )});if(raw){var p=JSON.parse(raw);if(p&&p.theme==="glass"){t="dark";m="glass";}else{if(p&&["light","dark"].indexOf(p.theme)>-1)t=p.theme;if(p&&["solid","glass"].indexOf(p.material)>-1)m=p.material;}if(p&&["cornered","soft"].indexOf(p.radius)>-1)r=p.radius;if(p&&["regular","floating"].indexOf(p.elevation)>-1)e=p.elevation;}}catch(_){}d.setAttribute("data-fuji-theme",t);d.setAttribute("data-fuji-material",m);d.setAttribute("data-fuji-radius",r);d.setAttribute("data-fuji-elevation",e);}finally{d.removeAttribute("data-fuji-boot");}})();`;
}
