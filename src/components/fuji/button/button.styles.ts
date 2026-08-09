import { cva } from "class-variance-authority";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export const buttonBase = cva(
  [
    // First so a variant's own border/background (added later via `cn()` in
    // Button.tsx) still wins - see native-control-reset.ts for why this is
    // needed without Tailwind preflight.
    NATIVE_CONTROL_RESET,
    "fj:inline-flex fj:cursor-pointer fj:select-none fj:items-center fj:justify-center fj:gap-2",
    "fj:rounded-fuji-control fj:font-medium fj:whitespace-nowrap",
    "fj:shadow-fuji-control fj:transition-[transform,box-shadow,background-color,color,border-color]",
    "fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
    "fj:active:scale-[var(--fuji-press-scale)]",
    "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "fj:h-[var(--fuji-control-h-sm)] fj:px-3 fj:text-[length:var(--fuji-text-sm)]",
        md: "fj:h-[var(--fuji-control-h-md)] fj:px-4 fj:text-[length:var(--fuji-text-base)]",
        lg: "fj:h-[var(--fuji-control-h-lg)] fj:px-5 fj:text-[length:var(--fuji-text-md)]",
      },
      fullWidth: {
        true: "fj:w-full",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      fullWidth: false,
    },
  },
);

export const iconButtonBase = cva(
  [
    NATIVE_CONTROL_RESET,
    "fj:inline-flex fj:cursor-pointer fj:select-none fj:items-center fj:justify-center fj:shrink-0",
    "fj:rounded-fuji-control fj:shadow-fuji-control fj:transition-[transform,box-shadow,background-color,color,border-color]",
    "fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
    "fj:active:scale-[var(--fuji-press-scale)]",
    "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "fj:size-[var(--fuji-control-h-sm)]",
        md: "fj:size-[var(--fuji-control-h-md)]",
        lg: "fj:size-[var(--fuji-control-h-lg)]",
      },
    },
    defaultVariants: { size: "md" },
  },
);
