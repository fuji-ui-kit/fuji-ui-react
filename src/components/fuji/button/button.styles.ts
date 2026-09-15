import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

const BUTTON_SIZES = {
  sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-3 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:h-[var(--fuji-control-h-md)] fj:px-4 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-5 fj:text-[length:var(--fuji-text-md)]",
} as const;

const BUTTON_BASE = [
  // First so a variant's own border/background (added later via `cn()` in
  // Button.tsx) still wins - see native-control-reset.ts for why this is
  // needed without Tailwind preflight.
  NATIVE_CONTROL_RESET,
  "fj:inline-flex fj:cursor-pointer fj:select-none fj:items-center fj:justify-center fj:gap-2",
  "fj:rounded-fuji-control fj:font-medium fj:whitespace-nowrap",
  // `asChild` renders these classes onto whatever the consumer passes - most
  // often a router `<Link>`, i.e. an `<a>` - and without preflight that anchor
  // keeps the UA underline under the button label.
  "fj:no-underline",
  "fj:shadow-fuji-control fj:transition-[transform,box-shadow,background-color,color,border-color]",
  "fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
  "fj:active:scale-[var(--fuji-press-scale)]",
  "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
  // Kept here rather than in Button.tsx's own JSX so every consumer of this
  // recipe gets it for free - it used to live only in Button.tsx, which is
  // exactly why IconButton (built from `iconButtonBase` below, not this
  // constant) shipped with no focus-visible styling at all and fell back to
  // the browser's native ring, measured at ~2:1 contrast against the page.
  "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
].join(" ");

/** Layout/size recipe for Button. */
export function buttonBase({
  size = "md",
  fullWidth = false,
}: { size?: keyof typeof BUTTON_SIZES; fullWidth?: boolean } = {}): string {
  return [BUTTON_BASE, BUTTON_SIZES[size], fullWidth ? "fj:w-full" : ""].filter(Boolean).join(" ");
}

const ICON_BUTTON_SIZES = {
  sm: "fj:size-[var(--fuji-control-h-sm)]",
  md: "fj:size-[var(--fuji-control-h-md)]",
  lg: "fj:size-[var(--fuji-control-h-lg)]",
} as const;

const ICON_BUTTON_BASE = [
  NATIVE_CONTROL_RESET,
  "fj:inline-flex fj:cursor-pointer fj:select-none fj:items-center fj:justify-center fj:shrink-0",
  "fj:rounded-fuji-control fj:shadow-fuji-control fj:transition-[transform,box-shadow,background-color,color,border-color]",
  "fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
  "fj:active:scale-[var(--fuji-press-scale)]",
  "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
  // See the matching comment in BUTTON_BASE above - every other focusable
  // Fuji control (Button, Checkbox, and field-surface.ts behind
  // Input/Select/Textarea/ComboBox) carries this outline; IconButton must
  // too, and living here means a future consumer of `iconButtonBase` can't
  // forget it the way Button.tsx's own JSX-only copy let IconButton do.
  "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
].join(" ");

/** Layout/size recipe for IconButton. */
export function iconButtonBase({ size = "md" }: { size?: keyof typeof ICON_BUTTON_SIZES } = {}): string {
  return `${ICON_BUTTON_BASE} ${ICON_BUTTON_SIZES[size]}`;
}
