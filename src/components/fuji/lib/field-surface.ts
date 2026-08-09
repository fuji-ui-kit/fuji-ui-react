import { cva } from "class-variance-authority";
import { NATIVE_CONTROL_RESET } from "./native-control-reset";

/**
 * Shared visual recipe for text-entry surfaces (Input, Textarea, NumberInput,
 * NativeSelect, OTP cell...). Fields sit on the main `--fuji-surface` (white in
 * light theme) with a plain border - flat, not elevated; `--fuji-surface-*`
 * tinted tones are reserved for secondary/nested panels, not form controls.
 */
export const fieldSurface = cva(
  [
    // First so the border/background below still wins over the reset's
    // border-0/bg-transparent - see native-control-reset.ts.
    NATIVE_CONTROL_RESET,
    "fuji-glass-surface-strong fj:w-full fj:min-w-0 fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground",
    "fj:placeholder:text-fuji-foreground-subtle fj:outline-none",
    "fj:transition-[border-color,box-shadow,background-color] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
    // `outline` never participates in layout (always painted outside the box,
    // unlike a border-width change), so this adds a 2px focus ring with zero
    // layout shift alongside the existing border-color change.
    "fj:focus-visible:border-fuji-foreground fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
    "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
    "fj:data-[invalid]:border-fuji-fire fj:data-[invalid]:focus-visible:border-fuji-fire",
    "fj:data-[readonly]:bg-fuji-surface-subtle",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-2.5 fj:text-[length:var(--fuji-text-sm)]",
        md: "fj:h-[var(--fuji-control-h-md)] fj:px-3 fj:text-[length:var(--fuji-text-base)]",
        lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-3.5 fj:text-[length:var(--fuji-text-md)]",
      },
    },
    defaultVariants: { size: "md" },
  },
);
