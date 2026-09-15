/** Shared public types for the Fuji component system. */

export type FujiTheme = "light" | "dark";
/**
 * The surface material for the active theme, orthogonal to `theme` itself -
 * either theme can render in either material. `"solid"` is the default,
 * opaque surface; `"glass"` overlays a translucent, blurred surface over
 * whichever theme is active rather than painting its own palette - light
 * theme + glass reads light, dark theme + glass reads dark. Split out from
 * `FujiTheme` (which used to include a third `"glass"` value) because a
 * single theme axis made light-mode-plus-glass and dark-mode-plus-glass
 * mutually exclusive - see `docs/theming.md`.
 */
export type FujiMaterial = "solid" | "glass";
export type FujiRadius = "cornered" | "soft";
/**
 * Global shadow depth. `regular` keeps the restrained default shadows;
 * `floating` swaps in deeper, softly layered shadows at meaningful component
 * boundaries without adding scale or hover motion to static surfaces.
 */
export type FujiElevation = "regular" | "floating";

export type ComponentSize = "sm" | "md" | "lg";

/**
 * Fuji's decorative color palette, used purely for visual styling (Button,
 * IconButton, ButtonGroup, Badge, Icon, and the tone variants on form
 * controls). `default` renders as the neutral near-black/cream identity
 * color; the rest are named after their visual character rather than a
 * semantic meaning - see `StatusTone` for components where the color itself
 * conveys meaning (success/error/etc.) rather than just a look.
 */
export type ComponentTone = "default" | "fire" | "water" | "forest" | "sun";

/**
 * Semantic status used by components where the value itself is meaningful
 * for accessibility (Alert, Toast, Result, StatusIndicator, Timeline,
 * Progress, CircularProgress) - the prop and its values never change
 * regardless of the decorative tone palette in use; each status is mapped
 * internally to a `ComponentTone` for styling only.
 */
export type StatusTone = "default" | "success" | "warning" | "danger" | "info";

/**
 * `dashed` renders a dashed border with a transparent background (AntD-style
 * "dashed" button) - supported by Button/IconButton; other components that
 * accept `ComponentAppearance` may treat it the same as `bordered` if a
 * dashed border doesn't apply to their shape.
 */
export type ComponentAppearance = "contained" | "bordered" | "dashed" | "ghost";

/** Mobile presentation for overlay components (Dialog, Drawer, Sheet). */
export type OverlayMobileBehavior = "dialog" | "sheet" | "fullscreen";

/** A key/value map for styling named internal slots via `classNames`. */
export type SlotClassNames<Slots extends string> = Partial<Record<Slots, string>>;
