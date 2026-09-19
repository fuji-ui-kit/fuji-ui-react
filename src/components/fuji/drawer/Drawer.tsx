"use client";

import * as React from "react";
import { Drawer as Base } from "@base-ui/react/drawer";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";

/**
 * Base UI's Drawer swipes to dismiss, `swipeDirection` defaulting to `"down"`; side drawers must
 * pass the matching direction, since the root cannot see the content's side.
 */
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

/**
 * How the panel meets its edge: `"full"` (default) spans it, rounded only on the inward corners;
 * `"sheet"` is an inset card for short, self-contained tasks, not navigation or long forms.
 */
export type DrawerVariant = "full" | "sheet";

/**
 * Side-panel width: `sm` 16rem, `md` 20rem (default), `lg` 28rem, `full` viewport less 3rem. Named
 * `width` because `size` elsewhere means a control's height/padding scale. Top/bottom ignore it.
 */
export type DrawerWidth = "sm" | "md" | "lg" | "full";

// Full class strings - Tailwind's scanner is static. Every width keeps the
// `max-w-[calc(100vw-3rem)]` cap from the side-panel recipes below, so even
// `lg` on a phone leaves the dimmed page visible and tappable to dismiss.
const SIDE_WIDTH: Record<DrawerWidth, string> = {
  sm: "fj:w-64",
  md: "fj:w-80",
  lg: "fj:w-[28rem]",
  full: "fj:w-full",
};

const VIEWPORT_JUSTIFY: Record<DrawerSide, string> = {
  left: "fj:justify-start fj:items-stretch",
  right: "fj:justify-end fj:items-stretch",
  top: "fj:items-start fj:justify-stretch",
  bottom: "fj:items-end fj:justify-stretch",
};

/*
 * Full class strings per variant and side - Tailwind's scanner is static. The top/bottom safe-area
 * inset is ADDED to the padding: a bare `pb-[env(...)]` overrode `p-6` and is `0px` on desktop.
 */
const POPUP_SIZE: Record<DrawerVariant, Record<DrawerSide, string>> = {
  full: {
    left: "fj:h-full fj:max-w-[calc(100vw-3rem)] fj:border-r fj:border-fuji-border fj:rounded-r-fuji-panel",
    right: "fj:h-full fj:max-w-[calc(100vw-3rem)] fj:border-l fj:border-fuji-border fj:rounded-l-fuji-panel",
    top: "fj:w-full fj:max-h-[85vh] fj:border-b fj:border-fuji-border fj:rounded-b-fuji-panel fj:pt-[calc(1.5rem+env(safe-area-inset-top))]",
    bottom:
      "fj:w-full fj:max-h-[85vh] fj:border-t fj:border-fuji-border fj:rounded-t-fuji-panel fj:pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
  },
  // The margins inset the card; on left/right the viewport stretches its child, so the vertical
  // margin sets the height too.
  sheet: {
    left: "fj:my-3 fj:ml-3 fj:max-w-[calc(100vw-3rem)] fj:border fj:border-fuji-border fj:rounded-fuji-panel",
    right:
      "fj:my-3 fj:mr-3 fj:max-w-[calc(100vw-3rem)] fj:border fj:border-fuji-border fj:rounded-fuji-panel",
    top: "fj:mx-auto fj:mt-3 fj:w-[calc(100%-1.5rem)] fj:max-w-lg fj:max-h-[85vh] fj:border fj:border-fuji-border fj:rounded-fuji-panel fj:pt-[calc(1.5rem+env(safe-area-inset-top))]",
    bottom:
      "fj:mx-auto fj:mb-3 fj:w-[calc(100%-1.5rem)] fj:max-w-lg fj:max-h-[85vh] fj:border fj:border-fuji-border fj:rounded-fuji-panel fj:pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
  },
};

/** Full slide in from the entering edge + fade, per side. */
const POPUP_TRANSITION: Record<DrawerSide, string> = {
  left: "fj:data-[starting-style]:-translate-x-full fj:data-[ending-style]:-translate-x-full",
  right: "fj:data-[starting-style]:translate-x-full fj:data-[ending-style]:translate-x-full",
  top: "fj:data-[starting-style]:-translate-y-full fj:data-[ending-style]:-translate-y-full",
  bottom: "fj:data-[starting-style]:translate-y-full fj:data-[ending-style]:translate-y-full",
};

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /** Which edge the panel slides in from. Match `Drawer`'s `swipeDirection` to it. */
  side?: DrawerSide;
  /** `"full"` (default) spans the edge; `"sheet"` is a detached, inset card. */
  variant?: DrawerVariant;
  /**
   * Side-panel width: `"sm"` 16rem, `"md"` 20rem, `"lg"` 28rem, `"full"` viewport less 3rem. Default
   * `"md"`. Capped at `calc(100vw - 3rem)`; ignored for `top`/`bottom`; `className` still wins.
   */
  width?: DrawerWidth;
  /** Drops the built-in close button. Leave a way out - Escape alone is not enough for a pointer user. */
  hideCloseButton?: boolean;
}

export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  { side = "right", variant = "full", width = "md", hideCloseButton = false, className, children, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Backdrop
        {...portalAttrs}
        className="fuji-overlay-backdrop fuji-motion-backdrop fj:fixed fj:inset-0 fj:z-50"
      />
      <Base.Viewport
        {...portalAttrs}
        className={cn("fj:fixed fj:inset-0 fj:z-50 fj:flex", VIEWPORT_JUSTIFY[side])}
      >
        <Base.Popup
          ref={ref}
          {...portalAttrs}
          className={cn(
            "fuji-glass-surface-overlay fuji-motion-sheet fj:relative fj:flex fj:flex-col fj:gap-4 fj:bg-fuji-surface-overlay fj:p-6 fj:shadow-fuji-overlay fj:outline-none",
            // The panel scrolls (side panels are viewport-tall, top/bottom cap at 85vh), without
            // chaining into the scroll-locked page, so long forms don't run off screen.
            "fuji-scrollbar fj:overflow-y-auto fj:overscroll-contain",
            POPUP_SIZE[variant][side],
            (side === "left" || side === "right") && SIDE_WIDTH[width],
            POPUP_TRANSITION[side],
            className,
          )}
          data-variant={variant}
          {...props}
        >
          {/* A bottom panel is drag-to-dismiss (Base UI handles the gesture;
              `.fuji-motion-sheet` follows it); the handle is the cue. */}
          {side === "bottom" && <span aria-hidden="true" className="fuji-sheet-handle" />}
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
