"use client";

import * as React from "react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { cn } from "../../../lib/cn";
import type { OverlayMobileBehavior } from "../../../types";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";
import { MOBILE_BEHAVIOR_CLASSES } from "./dialog.styles";

export const DialogRoot = Base.Root;
export const DialogTrigger = Base.Trigger;
export const DialogClose = Base.Close;

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof Base.Title>
>(function DialogTitle({ className, ...props }, ref) {
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

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Base.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <Base.Description
      ref={ref}
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /** How the dialog presents on narrow viewports. CSS-driven, no JS viewport checks. */
  mobileBehavior?: OverlayMobileBehavior;
  /** Hides the built-in top-right close button. */
  hideCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, children, mobileBehavior = "dialog", hideCloseButton = false, ...props },
  ref,
) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Backdrop
        {...portalAttrs}
        className="fuji-overlay-backdrop fuji-motion-backdrop fj:fixed fj:inset-0 fj:z-50"
      />
      <Base.Popup
        ref={ref}
        {...portalAttrs}
        className={cn(
          "fuji-glass-surface-overlay fuji-motion-modal fj:fixed fj:z-50 fj:flex fj:flex-col fj:gap-4 fj:bg-fuji-surface-overlay fj:p-6 fj:shadow-fuji-overlay fj:outline-none",
          // Every mobile behavior caps the popup at the viewport (85vh, or the
          // full height when fullscreen), but nothing let it scroll - content
          // taller than the cap spilled out past the rounded edge, and with the
          // page scroll-locked behind it the bottom was unreachable. The popup
          // itself scrolls; `overscroll-contain` keeps a flick at either end
          // from chaining into the locked page.
          "fuji-scrollbar fj:overflow-y-auto fj:overscroll-contain",
          MOBILE_BEHAVIOR_CLASSES[mobileBehavior],
          className,
        )}
        {...props}
      >
        {children}
        {/*
          Rendered after `children`, not before, even though it is positioned
          in the top-right corner either way. Initial focus lands on the first
          tabbable element in the popup, and with the close button first that
          was always "Close dialog" - a keyboard or screen-reader user opened
          every dialog focused on the way out of it, and had to tab past the
          content to reach the primary action. Absolute positioning means the
          visual order is unchanged.
        */}
        {!hideCloseButton && (
          <Base.Close
            render={<DismissButton aria-label="Close dialog" className="fj:absolute fj:top-3 fj:right-3" />}
          />
        )}
      </Base.Popup>
    </Base.Portal>
  );
});

/**
 * `<Dialog><Dialog.Trigger/><Dialog.Content mobileBehavior="sheet">
 *   <Dialog.Title/><Dialog.Description/>...
 * </Dialog.Content></Dialog>`
 */
export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Close: DialogClose,
  Title: DialogTitle,
  Description: DialogDescription,
});
