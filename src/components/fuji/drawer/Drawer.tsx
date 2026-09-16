"use client";

import * as React from "react";
import { Drawer as Base } from "@base-ui/react/drawer";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";

/**
 * Base UI's Drawer swipes to dismiss; `swipeDirection` defaults to `"down"`,
 * which is right for `side="bottom"`. For a side drawer pass the matching
 * direction (`<Drawer swipeDirection="right">` for `side="right"`) - the root
 * cannot see which side its content chose.
 *
 * `Drawer.Content` takes `variant="sheet"` for the detached, inset card
 * presentation; the default `"full"` spans its edge.
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
 * How the panel meets the edge it slides from.
 *
 * `"full"` (default) is the drawer proper: it spans the edge and is squared
 * off against it, rounded only on the two corners that face into the page -
 * the same shape on all four sides.
 *
 * `"sheet"` is the detached presentation: inset from every edge, rounded all
 * round, width- or height-capped, with the dimmed page still visible around
 * it so it reads as sitting above the content rather than replacing that side
 * of the screen. This is the shape for a short, self-contained task - a share
 * menu, a confirmation - not for navigation or a long form.
 */
export type DrawerVariant = "full" | "sheet";

/**
 * Width of a `left`/`right` panel: `sm` 16rem, `md` 20rem (the default, and
 * the only width before this prop existed), `lg` 28rem, `full` the whole
 * viewport less the 3rem strip every side panel leaves showing. Named `width`
 * rather than `size` for the same reason `Container`'s is - `size` everywhere
 * else in the package is a control's height/padding scale. Top and bottom
 * panels already span their edge and ignore it.
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
 * Full class strings per variant and side - never templated, since Tailwind's
 * scanner is static.
 *
 * The safe-area inset on the top and bottom panels is ADDED to the popup's own
 * padding, not substituted for it. Written as a bare `pb-[env(...)]` it
 * overrode `p-6`, and since that env var is `0px` on any desktop browser the
 * panel ended up with no bottom padding at all - its last control sat flush
 * against the screen edge.
 */
const POPUP_SIZE: Record<DrawerVariant, Record<DrawerSide, string>> = {
  full: {
    left: "fj:h-full fj:max-w-[calc(100vw-3rem)] fj:border-r fj:border-fuji-border fj:rounded-r-fuji-panel",
    right: "fj:h-full fj:max-w-[calc(100vw-3rem)] fj:border-l fj:border-fuji-border fj:rounded-l-fuji-panel",
    top: "fj:w-full fj:max-h-[85vh] fj:border-b fj:border-fuji-border fj:rounded-b-fuji-panel fj:pt-[calc(1.5rem+env(safe-area-inset-top))]",
    bottom:
      "fj:w-full fj:max-h-[85vh] fj:border-t fj:border-fuji-border fj:rounded-t-fuji-panel fj:pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
  },
  // The margins are what inset the card. On the left and right the viewport
  // stretches its child, so a vertical margin sets the height as well - there
  // is no need to compute one.
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
   * Width of a `left` or `right` panel: `"sm"` 16rem, `"md"` 20rem, `"lg"`
   * 28rem, `"full"` the viewport less a 3rem strip. Default `"md"`. Never wider
   * than `calc(100vw - 3rem)`. Ignored for `top`/`bottom`, which span their
   * edge. `className` still wins for a one-off width.
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
            // Side panels are viewport-tall and top/bottom ones cap at 85vh,
            // but none of them scrolled: a long form or record ran off the
            // screen with the page scroll-locked behind it. The panel itself
            // scrolls, without chaining into the locked page at either end.
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
