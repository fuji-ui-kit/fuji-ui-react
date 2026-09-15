"use client";

import * as React from "react";
import { Tooltip as Base } from "@base-ui/react/tooltip";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const TooltipProvider = Base.Provider;
export const TooltipRoot = Base.Root;
export const TooltipTrigger = Base.Trigger;

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /** Gap in px between the trigger and the tooltip. */
  sideOffset?: number;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent(
  { className, sideOffset = 6, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Positioner {...portalAttrs} sideOffset={sideOffset} className="fj:z-50 fj:outline-none">
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
