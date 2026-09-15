import { NATIVE_CONTROL_RESET } from "./native-control-reset";

/**
 * Shared visual recipe for text-entry surfaces (Input, Textarea, NumberInput,
 * NativeSelect, OTP cell...). Fields sit on the main `--fuji-surface` (white in
 * light theme) with a plain border - flat, not elevated; `--fuji-surface-*`
 * tinted tones are reserved for secondary/nested panels, not form controls.
 *
 * Deliberately NOT a glass material. Fields used to carry
 * `fuji-glass-surface-strong`, which under the glass theme put a 36px
 * `backdrop-filter` on every input on the page - a form with twenty fields
 * meant twenty extra compositing layers, for a blur nobody can see behind a
 * control that small. Glass materials belong on chrome, cards and overlays;
 * see "What gets the material" in docs/theming.md, which is where that
 * rule is now written down for consumers (it used to point at DESIGN.md,
 * which explains the tint and the blur but never says which element
 * categories receive them).
 */
const FIELD_SIZES = {
  sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-2.5 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:h-[var(--fuji-control-h-md)] fj:px-3 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-3.5 fj:text-[length:var(--fuji-text-md)]",
} as const;

const FIELD_BASE = [
  // First so the border/background below still wins over the reset's
  // border-0/bg-transparent - see native-control-reset.ts.
  NATIVE_CONTROL_RESET,
  "fj:w-full fj:min-w-0 fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground",
  "fj:placeholder:text-fuji-foreground-subtle fj:outline-none",
  "fj:transition-[border-color,box-shadow,background-color] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
  // `outline` never participates in layout (always painted outside the box,
  // unlike a border-width change), so this adds a 2px focus ring with zero
  // layout shift alongside the existing border-color change.
  "fj:focus-visible:border-fuji-foreground fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
  // This recipe is shared by real native controls (Input's `<input>`,
  // NativeSelect's `<select>`) AND non-native Base UI wrappers that carry
  // this className on a `<div role="group">` instead (NumberInput's
  // `NumberField.Group`, Combobox/MultiSelect's `InputGroup`) - a
  // `disabled:` pseudo-class variant is dead on the latter, since a plain
  // div can never satisfy `:disabled` even though `aria-disabled`/
  // `data-disabled` are correctly present (measured on NumberInput: the
  // spinner buttons dimmed correctly as real `:disabled` controls, but the
  // group around them stayed full-strength). Base UI mirrors `disabled`
  // onto every one of these elements as `data-disabled` regardless of
  // whether the underlying tag is a real form control, so the attribute
  // variant matches everywhere this recipe is used.
  "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
  "fj:data-[invalid]:border-fuji-fire fj:data-[invalid]:focus-visible:border-fuji-fire",
  "fj:data-[readonly]:bg-fuji-surface-subtle",
].join(" ");

export function fieldSurface({ size = "md" }: { size?: keyof typeof FIELD_SIZES } = {}): string {
  return `${FIELD_BASE} ${FIELD_SIZES[size]}`;
}
