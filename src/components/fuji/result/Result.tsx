import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface ResultProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: StatusTone;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

const ICONS: Partial<Record<StatusTone, React.ElementType>> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info,
};

const ICON_CLASSES: Partial<Record<StatusTone, string>> = {
  success: "fj:text-fuji-forest fj:bg-fuji-forest-soft",
  warning: "fj:text-fuji-sun fj:bg-fuji-sun-soft",
  danger: "fj:text-fuji-fire fj:bg-fuji-fire-soft",
  info: "fj:text-fuji-water fj:bg-fuji-water-soft",
};

/** Full-section outcome state (success/error/404/empty search) - bigger sibling of `EmptyState`. */
export const Result = React.forwardRef<HTMLDivElement, ResultProps>(function Result(
  { variant = "info", title, description, actions, className, ...props },
  ref,
) {
  const Icon = ICONS[variant] ?? Info;
  return (
    <div
      ref={ref}
      className={cn("fj:flex fj:flex-col fj:items-center fj:gap-3 fj:py-16 fj:text-center", className)}
      {...props}
    >
      <div
        className={cn(
          "fj:flex fj:size-14 fj:items-center fj:justify-center fj:rounded-full",
          ICON_CLASSES[variant] ?? "fj:bg-fuji-surface-strong fj:text-fuji-foreground-muted",
        )}
      >
        <Icon className="fj:size-6" />
      </div>
      <p className="fj:m-0 fj:text-[length:var(--fuji-text-xl)] fj:font-semibold fj:text-fuji-foreground">
        {title}
      </p>
      {description && (
        <p className="fj:m-0 fj:max-w-md fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground-muted">
          {description}
        </p>
      )}
      {actions && <div className="fj:mt-2 fj:flex fj:items-center fj:gap-3">{actions}</div>}
    </div>
  );
});
