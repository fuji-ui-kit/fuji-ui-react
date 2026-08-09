"use client";

import * as React from "react";
import { Drawer as Base } from "@base-ui/react/drawer";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";

export const DrawerRoot = Base.Root;
export const DrawerTrigger = Base.Trigger;
export const DrawerClose = Base.Close;

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof Base.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <Base.Title
      ref={ref}
      className={cn(
        "fj:m-0 fj:text-[length:var(--fuji-text-md)] fj:font-semibold fj:text-fuji-foreground",
        className,
      )}
      {...props}
    />
  );
});

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Base.Description>
>(function DrawerDescription({ className, ...props }, ref) {
  return (
    <Base.Description
      ref={ref}
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export type DrawerSide = "left" | "right" | "top" | "bottom";

const VIEWPORT_JUSTIFY: Record<DrawerSide, string> = {
  left: "fj:justify-start fj:items-stretch",
  right: "fj:justify-end fj:items-stretch",
  top: "fj:items-start fj:justify-stretch",
  bottom: "fj:items-end fj:justify-stretch",
};

const POPUP_SIZE: Record<DrawerSide, string> = {
  left: "fj:h-full fj:w-80 fj:max-w-[calc(100vw-3rem)] fj:border-r fj:border-fuji-border fj:rounded-r-fuji-panel",
  right:
    "fj:h-full fj:w-80 fj:max-w-[calc(100vw-3rem)] fj:border-l fj:border-fuji-border fj:rounded-l-fuji-panel",
  top: "fj:w-full fj:max-h-[85vh] fj:border-b fj:border-fuji-border fj:rounded-b-fuji-panel",
  bottom:
    "fj:w-full fj:max-h-[85vh] fj:border-t fj:border-fuji-border fj:rounded-t-fuji-panel fj:pb-[env(safe-area-inset-bottom)]",
};

/** Full slide in from the entering edge + fade, per side. */
const POPUP_TRANSITION: Record<DrawerSide, string> = {
  left: "fj:data-[starting-style]:-translate-x-full fj:data-[ending-style]:-translate-x-full",
  right: "fj:data-[starting-style]:translate-x-full fj:data-[ending-style]:translate-x-full",
  top: "fj:data-[starting-style]:-translate-y-full fj:data-[ending-style]:-translate-y-full",
  bottom: "fj:data-[starting-style]:translate-y-full fj:data-[ending-style]:translate-y-full",
};

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  side?: DrawerSide;
  hideCloseButton?: boolean;
}

export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  { side = "right", hideCloseButton = false, className, children, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Backdrop
        {...portalAttrs}
        className="fuji-overlay-backdrop fj:fixed fj:inset-0 fj:z-50 fj:transition-opacity fj:duration-[var(--fuji-duration-base)] fj:data-[ending-style]:opacity-0 fj:data-[starting-style]:opacity-0"
      />
      <Base.Viewport
        {...portalAttrs}
        className={cn("fj:fixed fj:inset-0 fj:z-50 fj:flex", VIEWPORT_JUSTIFY[side])}
      >
        <Base.Popup
          ref={ref}
          {...portalAttrs}
          className={cn(
            "fuji-glass-surface-overlay fj:relative fj:flex fj:flex-col fj:gap-4 fj:bg-fuji-surface-overlay fj:p-6 fj:shadow-fuji-overlay fj:outline-none",
            "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-slow)] fj:ease-[var(--fuji-ease)]",
            "fj:data-[starting-style]:opacity-0 fj:data-[ending-style]:opacity-0",
            POPUP_SIZE[side],
            POPUP_TRANSITION[side],
            className,
          )}
          {...props}
        >
          {!hideCloseButton && (
            <Base.Close
              render={<DismissButton aria-label="Close" className="fj:absolute fj:top-3 fj:right-3" />}
            />
          )}
          {children}
        </Base.Popup>
      </Base.Viewport>
    </Base.Portal>
  );
});

/** `<Drawer><Drawer.Trigger/><Drawer.Content side="right">...</Drawer.Content></Drawer>` */
export const Drawer = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Close: DrawerClose,
  Title: DrawerTitle,
  Description: DrawerDescription,
});
