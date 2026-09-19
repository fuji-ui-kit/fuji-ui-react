"use client";

import * as React from "react";
import { AlertDialog as Base } from "@base-ui/react/alert-dialog";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const AlertDialogRoot = Base.Root;
export const AlertDialogTrigger = Base.Trigger;
export const AlertDialogClose = Base.Close;

export const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof Base.Title>
>(function AlertDialogTitle({ className, ...props }, ref) {
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

export const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Base.Description>
>(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <Base.Description
      ref={ref}
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Popup>
>(function AlertDialogContent({ className, children, ...props }, ref) {
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
          "fuji-glass-surface-overlay fuji-motion-modal fj:fixed fj:top-1/2 fj:left-1/2 fj:z-50 fj:flex fj:w-[calc(100vw-2rem)] fj:max-w-sm fj:-translate-x-1/2 fj:-translate-y-1/2 fj:flex-col fj:gap-4",
          "fj:rounded-fuji-overlay fj:bg-fuji-surface-overlay fj:p-6 fj:shadow-fuji-overlay fj:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </Base.Popup>
    </Base.Portal>
  );
});

export const AlertDialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function AlertDialogFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fj:flex fj:justify-end fj:gap-3", className)} {...props} />;
  },
);

/**
 * For destructive/blocking confirmations needing an explicit choice (WAI-ARIA alertdialog), unlike
 * `Dialog`. `<AlertDialog><AlertDialog.Trigger/><AlertDialog.Content>...</AlertDialog.Content></AlertDialog>`
 */
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Trigger: AlertDialogTrigger,
  Content: AlertDialogContent,
  Close: AlertDialogClose,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Footer: AlertDialogFooter,
});
