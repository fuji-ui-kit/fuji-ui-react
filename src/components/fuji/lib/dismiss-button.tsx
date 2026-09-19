import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "./native-control-reset";

export interface DismissButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
}

/**
 * Bare "X" dismiss control shared by every dismissible overlay (Dialog, Drawer, Toast, Image
 * preview...). Deliberately chrome-free: just the icon with an opacity shift on a real <button>.
 */
export const DismissButton = React.forwardRef<HTMLButtonElement, DismissButtonProps>(function DismissButton(
  { className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        NATIVE_CONTROL_RESET,
        "fj:flex fj:size-6 fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:text-fuji-foreground-muted fj:opacity-70 fj:outline-none",
        "fj:transition-opacity fj:duration-[var(--fuji-duration-fast)] fj:hover:opacity-100 fj:focus-visible:opacity-100",
        className,
      )}
      {...props}
    >
      <X className="fj:size-4" />
    </button>
  );
});
