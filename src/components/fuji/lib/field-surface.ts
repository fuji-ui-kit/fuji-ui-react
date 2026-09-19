import { NATIVE_CONTROL_RESET } from "./native-control-reset";

/**
 * Shared recipe for text-entry surfaces (Input, Textarea, NativeSelect...): flat and NOT glass - a 36px
 * `backdrop-filter` per input cost a compositing layer each (docs/theming.md "What gets the material").
 */
const FIELD_SIZES = {
  sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-2.5 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:h-[var(--fuji-control-h-md)] fj:px-3 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-3.5 fj:text-[length:var(--fuji-text-md)]",
} as const;

const FIELD_BASE = [
  // First, so the border/background below beat the reset's border-0/bg-transparent.
  NATIVE_CONTROL_RESET,
  "fj:w-full fj:min-w-0 fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground",
  "fj:placeholder:text-fuji-foreground-subtle fj:outline-none",
  "fj:transition-[border-color,box-shadow,background-color] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
  // A 2px `outline` focus ring: unlike a border-width change, it causes no layout shift.
  "fj:focus-visible:border-fuji-foreground fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
  // `data-[disabled]`, not `disabled:`: this also styles Base UI `<div role="group">` wrappers
  // (NumberField.Group, InputGroup), which never match `:disabled` (NumberInput's group stayed
  // full-strength), while Base UI sets `data-disabled` on every element that uses this recipe.
  "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
  "fj:data-[invalid]:border-fuji-fire fj:data-[invalid]:focus-visible:border-fuji-fire",
  "fj:data-[readonly]:bg-fuji-surface-subtle",
].join(" ");

export function fieldSurface({ size = "md" }: { size?: keyof typeof FIELD_SIZES } = {}): string {
  return `${FIELD_BASE} ${FIELD_SIZES[size]}`;
}
