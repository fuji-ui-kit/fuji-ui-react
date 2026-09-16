"use client";

import * as React from "react";
import { Menu as Base } from "@base-ui/react/menu";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const DropdownMenuRoot = Base.Root;
export const DropdownMenuTrigger = Base.Trigger;
export const DropdownMenuGroup = Base.Group;
export const DropdownMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.GroupLabel>
>(function DropdownMenuGroupLabel({ className, ...props }, ref) {
  // Was a bare re-export of the Base UI primitive, so it rendered at body
  // size, foreground color, flush against the popup edge - a heading that
  // looked like a broken menu item. Same recipe as CommandMenu's group label.
  return (
    <Base.GroupLabel
      ref={ref}
      className={cn(
        "fj:px-3 fj:pt-1.5 fj:pb-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <Base.Separator ref={ref} className={cn("fj:my-1 fj:h-px fj:bg-fuji-border", className)} {...props} />
  );
});

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Item>
>(function DropdownMenuItem({ className, ...props }, ref) {
  return (
    <Base.Item
      ref={ref}
      className={cn(
        "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-fuji-item fj:px-3 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
        // `--fuji-surface-strong` is a translucent WHITE fill under glass, so a
        // highlighted row tracked the backdrop and washed out over the
        // atmosphere's bright pixels (measured 3.35:1 here). Same fill/text
        // inversion every other selection indicator uses - and the one
        // CommandMenu already moved to for this exact reason.
        "fj:data-[highlighted]:bg-fuji-contained-default fj:data-[highlighted]:text-fuji-default-foreground",
        "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
});

export interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /**
   * Which side of the trigger the menu opens on. Forwarded to Base UI's
   * Positioner, which flips it when there is no room. Default "bottom".
   */
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end";
  /** Gap in px between the trigger and the menu. Default 6. */
  sideOffset?: number;
  /** How the menu lines up against the trigger along its cross axis. Default "start". */
  align?: "start" | "center" | "end";
  /** Shift in px along the cross axis, away from the `align` edge. Default 0. */
  alignOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(
    { className, side, sideOffset = 6, align = "start", alignOffset, children, ...props },
    ref,
  ) {
    const portalAttrs = usePortalThemeAttrs();
    return (
      <Base.Portal>
        <Base.Positioner
          {...portalAttrs}
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          className="fj:z-50 fj:outline-none"
        >
          <Base.Popup
            ref={ref}
            {...portalAttrs}
            className={cn(
              "fuji-glass-surface-overlay fuji-motion-popup fj:min-w-[10rem] fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:p-1 fj:shadow-fuji-overlay fj:outline-none",
              className,
            )}
            {...props}
          >
            {children}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    );
  },
);

/**
 * `<DropdownMenu><DropdownMenu.Trigger/><DropdownMenu.Content>
 *   <DropdownMenu.Item/>...
 * </DropdownMenu.Content></DropdownMenu>`
 */
export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Group: DropdownMenuGroup,
  GroupLabel: DropdownMenuGroupLabel,
});
