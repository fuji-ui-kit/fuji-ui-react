"use client";

import * as React from "react";
import { Tooltip as Base } from "@base-ui/react/tooltip";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const TooltipProvider = Base.Provider;
export const TooltipRoot = Base.Root;
export const TooltipTrigger = Base.Trigger;

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
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
            "fj:max-w-xs fj:rounded-[6px] fj:bg-fuji-foreground fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-background fj:shadow-fuji-panel",
            "fj:origin-[var(--transform-origin)] fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-fast)]",
            "fj:data-[starting-style]:scale-95 fj:data-[starting-style]:opacity-0",
            "fj:data-[ending-style]:scale-95 fj:data-[ending-style]:opacity-0",
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
