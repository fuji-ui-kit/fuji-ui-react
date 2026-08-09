"use client";

import * as React from "react";
import { Popover as Base } from "@base-ui/react/popover";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const PopoverRoot = Base.Root;
export const PopoverTrigger = Base.Trigger;
export const PopoverClose = Base.Close;

export const PopoverTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof Base.Title>
>(function PopoverTitle({ className, ...props }, ref) {
  return (
    <Base.Title
      ref={ref}
      className={cn(
        "fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-semibold fj:text-fuji-foreground",
        className,
      )}
      {...props}
    />
  );
});

export const PopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Base.Description>
>(function PopoverDescription({ className, ...props }, ref) {
  return (
    <Base.Description
      ref={ref}
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  sideOffset?: number;
  showArrow?: boolean;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  { className, children, sideOffset = 8, showArrow = true, ...props },
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
            "fuji-glass-surface-overlay fj:relative fj:flex fj:max-w-sm fj:flex-col fj:gap-1.5 fj:rounded-fuji-panel fj:bg-fuji-surface-overlay fj:p-4",
            "fj:shadow-fuji-overlay fj:outline-none fj:origin-[var(--transform-origin)]",
            "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
            "fj:data-[starting-style]:scale-95 fj:data-[starting-style]:opacity-0",
            "fj:data-[ending-style]:scale-95 fj:data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {showArrow && (
            <Base.Arrow className="fj:data-[side=bottom]:-top-[6px] fj:data-[side=top]:-bottom-[6px] fj:data-[side=left]:-right-[6px] fj:data-[side=right]:-left-[6px]">
              <div className="fj:size-2.5 fj:rotate-45 fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay" />
            </Base.Arrow>
          )}
          {children}
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
});

/** `<Popover><Popover.Trigger/><Popover.Content>...</Popover.Content></Popover>` */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
  Title: PopoverTitle,
  Description: PopoverDescription,
});
