/**
 * Resets browser UA chrome on the native form-control elements Fuji renders
 * directly (`<button>`, and the native `<input>`/`<select>` Base UI wraps):
 * box-sizing, border, background, margin/padding, platform appearance, and
 * font inheritance.
 *
 * Every one of these is normally supplied by Tailwind's preflight layer,
 * which this package deliberately never ships - shipping it would reset the
 * global styles of every app that imports `styles.css` (see SPEC.md §8,
 * ARCHITECTURE.md "CSS pipeline"). Without preflight, a bare `<button>` or
 * `<input>` falls back to native OS chrome (grey background, outset border,
 * platform font) instead of Fuji's intended appearance.
 *
 * Apply this FIRST in a `cn(...)` call, before the component's own
 * border/background/padding classes - tailwind-merge keeps the last class in
 * each conflicting group, so a component that sets its own `border` or `bg-*`
 * after this still wins, while a raw control with no such override (e.g.
 * DataTable's sort button, Pagination's page-number button) gets a fully
 * neutral baseline instead of silently depending on preflight.
 */
export const NATIVE_CONTROL_RESET =
  "fj:box-border fj:m-0 fj:border-0 fj:bg-transparent fj:p-0 fj:appearance-none fj:[font-family:inherit]";

/**
 * The anchor equivalent. Without preflight a bare `<a href>` keeps the UA
 * stylesheet's underline and its `-webkit-link` blue - and because the
 * underline is painted by the anchor itself, a colored `<span>` inside it
 * does NOT hide it: Navbar rendered grey labels sitting on bright blue
 * underlines. Apply to every anchor whose appearance is defined by Fuji
 * rather than by the consumer (`Link` manages its own underline and is the
 * one deliberate exception).
 */
export const NATIVE_LINK_RESET = "fj:text-inherit fj:no-underline";
