import * as React from "react";
import { Fieldset as Base } from "@base-ui/react/fieldset";
import { cn } from "../../../lib/cn";

export const FieldsetRoot = React.forwardRef<
  HTMLFieldSetElement,
  React.ComponentPropsWithoutRef<typeof Base.Root>
>(function FieldsetRoot({ className, ...props }, ref) {
  return (
    <Base.Root
      ref={ref}
      className={cn(
        "fuji-glass-surface fj:flex fj:flex-col fj:gap-4 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-5 fj:shadow-fuji-card",
        className,
      )}
      {...props}
    />
  );
});

export const FieldsetLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Legend>
>(function FieldsetLegend({ className, ...props }, ref) {
  return (
    <Base.Legend
      ref={ref}
      className={cn(
        "fj:px-0 fj:text-[length:var(--fuji-text-md)] fj:font-semibold fj:text-fuji-foreground",
        className,
      )}
      {...props}
    />
  );
});

/** `<Fieldset><Fieldset.Legend/>...controls...</Fieldset>` */
export const Fieldset = Object.assign(FieldsetRoot, { Legend: FieldsetLegend });
