/** Shared public types for the Fuji component system. */

export type FujiTheme = "light" | "dark";
/**
 * Surface material, orthogonal to `theme`: `"solid"` (default) is opaque; `"glass"` blurs over
 * whichever theme is active. Split from `FujiTheme` so light+glass and dark+glass can coexist.
 */
export type FujiMaterial = "solid" | "glass";
export type FujiRadius = "cornered" | "soft";
/**
 * Global shadow depth: `regular` keeps restrained defaults; `floating` layers deeper, softer
 * shadows at component boundaries, without adding scale or hover motion to static surfaces.
 */
export type FujiElevation = "regular" | "floating";

export type ComponentSize = "sm" | "md" | "lg";

/**
 * Decorative palette for visual styling only (Button, Badge, Icon, form-control tones). `default`
 * is the neutral near-black/cream identity color; for color that conveys meaning see `StatusTone`.
 */
export type ComponentTone = "default" | "fire" | "water" | "forest" | "sun";

/**
 * Semantic status where the value matters for accessibility (Alert, Toast, Result, Progress, ...);
 * mapped internally to a `ComponentTone` for styling only, so the prop never changes with palette.
 */
export type StatusTone = "default" | "success" | "warning" | "danger" | "info";

/**
 * `dashed` is a dashed border on a transparent background (Button/IconButton); other components
 * may render it as `bordered` where a dashed border doesn't fit their shape.
 */
export type ComponentAppearance = "contained" | "bordered" | "dashed" | "ghost";

/** Mobile presentation for overlay components (Dialog, Drawer, Sheet). */
export type OverlayMobileBehavior = "dialog" | "sheet" | "fullscreen";

/** A key/value map for styling named internal slots via `classNames`. */
export type SlotClassNames<Slots extends string> = Partial<Record<Slots, string>>;
