import type { FujiElevation, FujiRadius, FujiTheme } from "../types";

/**
 * One persisted appearance preference (theme + radius + elevation) so a
 * selection survives client navigation, opening an example in a new tab, and
 * refresh. Storage access is wrapped so unavailable/blocked storage (private
 * mode, disabled cookies) never breaks rendering.
 */
export const APPEARANCE_STORAGE_KEY = "fuji-appearance";

export interface StoredAppearance {
  theme: FujiTheme;
  radius: FujiRadius;
  elevation: FujiElevation;
}

const THEMES: readonly FujiTheme[] = ["light", "dark", "glass"];
const RADII: readonly FujiRadius[] = ["cornered", "soft"];
const ELEVATIONS: readonly FujiElevation[] = ["regular", "floating"];

/**
 * The literal defaults the root layout boots with, fed into the pre-paint
 * appearance bootstrap script rendered in `layout.tsx`.
 */
export const DEFAULT_APPEARANCE: StoredAppearance = {
  theme: "light",
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
    return {
      theme: coerce(parsed.theme, THEMES),
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
  return `(function(){var d=document.documentElement;try{var t=${JSON.stringify(
    defaults.theme,
  )},r=${JSON.stringify(defaults.radius)},e=${JSON.stringify(
    defaults.elevation,
  )};try{var raw=window.localStorage.getItem(${JSON.stringify(
    APPEARANCE_STORAGE_KEY,
  )});if(raw){var p=JSON.parse(raw);if(p&&["light","dark","glass"].indexOf(p.theme)>-1)t=p.theme;if(p&&["cornered","soft"].indexOf(p.radius)>-1)r=p.radius;if(p&&["regular","floating"].indexOf(p.elevation)>-1)e=p.elevation;}}catch(_){}d.setAttribute("data-fuji-theme",t);d.setAttribute("data-fuji-radius",r);d.setAttribute("data-fuji-elevation",e);}finally{d.removeAttribute("data-fuji-boot");}})();`;
}
