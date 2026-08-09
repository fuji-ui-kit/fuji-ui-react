"use client";

import * as React from "react";
import { Menu as Base } from "@base-ui/react/menu";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const DropdownMenuRoot = Base.Root;
export const DropdownMenuTrigger = Base.Trigger;
export const DropdownMenuGroup = Base.Group;
export const DropdownMenuGroupLabel = Base.GroupLabel;

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
        "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-[6px] fj:px-3 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
        "fj:data-[highlighted]:bg-fuji-surface-strong",
        "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
});

export interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent({ className, sideOffset = 6, align = "start", children, ...props }, ref) {
    const portalAttrs = usePortalThemeAttrs();
    return (
      <Base.Portal>
        <Base.Positioner
          {...portalAttrs}
          sideOffset={sideOffset}
          align={align}
          className="fj:z-50 fj:outline-none"
        >
          <Base.Popup
            ref={ref}
            {...portalAttrs}
            className={cn(
              "fuji-glass-surface-overlay fj:min-w-[10rem] fj:origin-[var(--transform-origin)] fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:p-1 fj:shadow-fuji-overlay fj:outline-none",
              "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-fast)]",
              "fj:data-[starting-style]:scale-95 fj:data-[starting-style]:opacity-0",
              "fj:data-[ending-style]:scale-95 fj:data-[ending-style]:opacity-0",
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
