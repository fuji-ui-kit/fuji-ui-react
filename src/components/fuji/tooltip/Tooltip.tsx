"use client";

import * as React from "react";
import { Tooltip as Base } from "@base-ui/react/tooltip";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const TooltipProvider = Base.Provider;
export const TooltipRoot = Base.Root;
export const TooltipTrigger = Base.Trigger;

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /**
   * Which side of the trigger the tooltip opens on. Forwarded to Base UI's
   * Positioner, which flips it when there is no room. Default "top".
   */
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end";
  /** How the tooltip lines up against the trigger along its cross axis. Default "center". */
  align?: "start" | "center" | "end";
  /** Gap in px between the trigger and the tooltip. Default 6. */
  sideOffset?: number;
  /** Shift in px along the cross axis, away from the `align` edge. Default 0. */
  alignOffset?: number;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent(
  { className, side, align, sideOffset = 6, alignOffset, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Positioner
        {...portalAttrs}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="fj:z-50 fj:outline-none"
      >
        <Base.Popup
          ref={ref}
          {...portalAttrs}
          className={cn(
            "fuji-motion-popup fj:max-w-xs fj:rounded-fuji-item fj:bg-fuji-foreground fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-background fj:shadow-fuji-panel",
            className,
          )}
          {...props}
        />
      </Base.Positioner>
    </Base.Portal>
  );
});

/** `<Tooltip><Tooltip.Trigger/><Tooltip.Content>Label</Tooltip.Content></Tooltip>` - wrap the app once in `Tooltip.Provider` to share open/close delays. */
export const Tooltip = Object.assign(TooltipRoot, {
  Provider: TooltipProvider,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
});
