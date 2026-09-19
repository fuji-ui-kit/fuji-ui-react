"use client";

import * as React from "react";
import { Popover as Base } from "@base-ui/react/popover";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { useUntransformedPositioner } from "../lib/use-untransformed-positioner";

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
  /**
   * Which side of the trigger the panel opens on. Forwarded to Base UI's
   * Positioner, which flips it when there is no room. Default "bottom".
   */
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end";
  /** How the panel lines up against the trigger along its cross axis. Default "center". */
  align?: "start" | "center" | "end";
  /** Gap in px between the trigger and the panel. Default 8. */
  sideOffset?: number;
  /** Shift in px along the cross axis, away from the `align` edge. Default 0. */
  alignOffset?: number;
  /** Draws the triangle pointing back at the trigger. */
  showArrow?: boolean;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  { className, children, side, align, sideOffset = 8, alignOffset, showArrow = true, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  // See use-untransformed-positioner: the popup's glass material cannot blur
  // while the positioner carries a transform.
  const positionerRef = useUntransformedPositioner<HTMLDivElement>();
  return (
    <Base.Portal>
      <Base.Positioner
        ref={positionerRef}
        {...portalAttrs}
        // Positioning props belong to the Positioner, not the Popup - spread
        // onto the popup (where `...props` goes) they were silently dropped,
        // so only `sideOffset` could ever be set.
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
            "fuji-glass-surface-overlay fuji-motion-popup fj:relative fj:flex fj:max-w-sm fj:flex-col fj:gap-1.5 fj:rounded-fuji-panel fj:bg-fuji-surface-overlay fj:p-4",
            "fj:shadow-fuji-overlay fj:outline-none",
            className,
          )}
          {...props}
        >
          {showArrow && (
            <Base.Arrow className="fj:data-[side=bottom]:-top-[7px] fj:data-[side=top]:-bottom-[7px] fj:data-[side=left]:-right-[7px] fj:data-[side=right]:-left-[7px]">
              {/* Clipped triangle in the panel fill (as ChatBubble), not a rotated bordered square
                  whose far edges read as a diamond. It's a sibling of the popup, so it needs the
                  same material class or it reads as a lighter, unblurred chip. */}
              <div
                className={cn(
                  // `data-side` lives on Base UI's Arrow, which is this div's
                  // PARENT, so each variant has to reach up to it.
                  "fuji-glass-surface-overlay fj:size-2.5 fj:bg-fuji-surface-overlay",
                  "fj:[[data-side=bottom]_&]:[clip-path:polygon(50%_0,100%_100%,0_100%)]",
                  "fj:[[data-side=top]_&]:[clip-path:polygon(0_0,100%_0,50%_100%)]",
                  "fj:[[data-side=left]_&]:[clip-path:polygon(0_0,100%_50%,0_100%)]",
                  "fj:[[data-side=right]_&]:[clip-path:polygon(100%_0,100%_100%,0_50%)]",
                )}
              />
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
