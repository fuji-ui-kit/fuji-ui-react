"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { NavigationMenu as Base } from "@base-ui/react/navigation-menu";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const NavigationMenuRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Root>
>(function NavigationMenuRoot({ className, ...props }, ref) {
  return <Base.Root ref={ref} className={cn("fj:min-w-max", className)} {...props} />;
});

export const NavigationMenuList = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<typeof Base.List>
>(function NavigationMenuList({ className, ...props }, ref) {
  return (
    <Base.List
      ref={ref}
      className={cn("fj:m-0 fj:flex fj:list-none fj:items-center fj:gap-1 fj:p-0", className)}
      {...props}
    />
  );
});

export const NavigationMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<typeof Base.Item>
>(function NavigationMenuItem({ className, ...props }, ref) {
  return <Base.Item ref={ref} className={cn("fj:list-none", className)} {...props} />;
});

export const NavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Base.Link>
>(function NavigationMenuLink({ className, ...props }, ref) {
  return (
    <Base.Link
      ref={ref}
      className={cn(
        "fj:box-border fj:block fj:rounded-fuji-item fj:px-3 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:no-underline fj:outline-none",
        "fuji-hover-raised fj:data-[active]:font-medium",
        className,
      )}
      {...props}
    />
  );
});

const triggerClasses =
  "fj:flex fj:h-9 fj:cursor-pointer fj:items-center fj:gap-1 fj:rounded-fuji-control fj:px-3 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground fj:outline-none fj:select-none fuji-hover-raised";

export const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Base.Trigger>
>(function NavigationMenuTrigger({ className, children, ...props }, ref) {
  return (
    <Base.Trigger ref={ref} className={cn(NATIVE_CONTROL_RESET, triggerClasses, className)} {...props}>
      {children}
      <Base.Icon className="fj:transition-transform fj:duration-[var(--fuji-duration-base)] fj:data-[popup-open]:rotate-180">
        <ChevronDown className="fj:size-3.5" />
      </Base.Icon>
    </Base.Trigger>
  );
});

export const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Content>
>(function NavigationMenuContent({ className, ...props }, ref) {
  return <Base.Content ref={ref} className={cn("fj:p-4", className)} {...props} />;
});

export interface NavigationMenuPortalProps {
  /** The positioned menu surface to portal out of the layout. */
  children?: React.ReactNode;
}

export function NavigationMenuPortal({ children }: NavigationMenuPortalProps) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Positioner
        {...portalAttrs}
        sideOffset={8}
        className="fj:z-50 fj:h-[var(--positioner-height)] fj:w-[var(--positioner-width)] fj:max-w-[var(--available-width)] fj:outline-none fj:transition-[top,left,right,bottom] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]"
      >
        <Base.Popup
          {...portalAttrs}
          className={cn(
            "fuji-glass-surface-overlay fuji-motion-popup-morph fj:relative fj:h-[var(--popup-height)] fj:w-[var(--popup-width)] fj:overflow-hidden",
            "fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
          )}
        >
          <Base.Viewport className="fj:relative fj:h-full fj:w-full fj:overflow-hidden">
            {children}
          </Base.Viewport>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

/** `<NavigationMenu><NavigationMenu.List><NavigationMenu.Item>
 *   <NavigationMenu.Trigger/><NavigationMenu.Content/>
 * </NavigationMenu.Item></NavigationMenu.List><NavigationMenu.Portal/></NavigationMenu>`
 */
export const NavigationMenu = Object.assign(NavigationMenuRoot, {
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Portal: NavigationMenuPortal,
});
