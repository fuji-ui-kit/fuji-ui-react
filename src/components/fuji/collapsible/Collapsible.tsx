"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible as Base } from "@base-ui/react/collapsible";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

/** Reuses Card's exact surface recipe (border/background/radius/padding) so a
 *  Collapsible reads as a composed card, not a bare trigger+panel pair. */
export const CollapsibleRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Root>
>(function CollapsibleRoot({ className, ...props }, ref) {
  return (
    <Base.Root
      ref={ref}
      className={cn(
        "fj:box-border fuji-glass-surface fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-4",
        className,
      )}
      {...props}
    />
  );
});

export interface CollapsibleTriggerProps extends React.ComponentPropsWithoutRef<typeof Base.Trigger> {
  hideIcon?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ className, children, hideIcon = false, ...props }, ref) {
    return (
      <Base.Trigger
        ref={ref}
        className={cn(
          NATIVE_CONTROL_RESET,
          "fj:group fj:flex fj:w-full fj:cursor-pointer fj:items-center fj:justify-between fj:gap-2 fj:text-left fj:text-[length:var(--fuji-text-base)] fj:font-medium",
          "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
          "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
          className,
        )}
        {...props}
      >
        {children}
        {!hideIcon && (
          <ChevronRight className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted fj:transition-transform fj:duration-[var(--fuji-duration-base)] fj:group-data-[panel-open]:rotate-90" />
        )}
      </Base.Trigger>
    );
  },
);

export const CollapsiblePanel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Panel>
>(function CollapsiblePanel({ className, children, ...props }, ref) {
  return (
    <Base.Panel
      ref={ref}
      className={cn(
        "fj:h-[var(--collapsible-panel-height)] fj:overflow-hidden fj:opacity-100 fj:transition-[height,opacity] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        "fj:data-[starting-style]:h-0 fj:data-[starting-style]:opacity-0 fj:data-[ending-style]:h-0 fj:data-[ending-style]:opacity-0",
        "fj:[&[hidden]:not([hidden='until-found'])]:hidden",
        className,
      )}
      {...props}
    >
      <div className="fj:pt-2">{children}</div>
    </Base.Panel>
  );
});

/** Compound: `<Collapsible.Root><Collapsible.Trigger/><Collapsible.Panel/></Collapsible.Root>` */
export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
};
