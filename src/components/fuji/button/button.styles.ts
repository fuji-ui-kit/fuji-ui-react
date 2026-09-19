import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

const BUTTON_SIZES = {
  sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-3 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:h-[var(--fuji-control-h-md)] fj:px-4 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-5 fj:text-[length:var(--fuji-text-md)]",
} as const;

const BUTTON_BASE = [
  // First so a variant's border/background (added later via `cn()`) still wins; see
  // native-control-reset.ts for why this is needed without preflight.
  NATIVE_CONTROL_RESET,
  "fj:inline-flex fj:cursor-pointer fj:select-none fj:items-center fj:justify-center fj:gap-2",
  "fj:rounded-fuji-control fj:font-medium fj:whitespace-nowrap",
  // `asChild` often renders these onto a router `<a>`, which keeps the UA underline without preflight.
  "fj:no-underline",
  "fj:shadow-fuji-control fj:transition-[transform,box-shadow,background-color,color,border-color]",
  "fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
  "fj:active:scale-[var(--fuji-press-scale)]",
  "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
  // Lives in the shared recipe, not Button.tsx's JSX, so every consumer gets it; IconButton once
  // shipped without it and fell back to the native ring (~2:1 contrast).
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
  // Same focus outline as BUTTON_BASE and every other focusable Fuji control; kept in the recipe
  // so no `iconButtonBase` consumer can forget it.
  "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
].join(" ");

/** Layout/size recipe for IconButton. */
export function iconButtonBase({ size = "md" }: { size?: keyof typeof ICON_BUTTON_SIZES } = {}): string {
  return `${ICON_BUTTON_BASE} ${ICON_BUTTON_SIZES[size]}`;
}
