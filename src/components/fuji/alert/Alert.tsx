import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";
import { softClasses, STATUS_TONE_MAP } from "../lib/appearance";
import { DismissButton } from "../lib/dismiss-button";

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: StatusTone;
  title?: React.ReactNode;
  onDismiss?: () => void;
}

const ICONS: Partial<Record<StatusTone, React.ElementType>> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info,
};

/** Static inline banner for page/section-level messages. Use `Toast` for transient feedback. */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, onDismiss, className, children, ...props },
  ref,
) {
  const Icon = ICONS[variant] ?? Info;
  return (
    <div
      ref={ref}
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "fj:flex fj:items-start fj:gap-3 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:p-[var(--fuji-panel-p)] fj:text-[length:var(--fuji-text-base)]",
        softClasses(STATUS_TONE_MAP[variant]),
        className,
      )}
      {...props}
    >
      <Icon className="fj:mt-0.5 fj:size-4 fj:shrink-0" aria-hidden="true" />
      <div className="fj:flex-1 fj:min-w-0">
        {title && <p className="fj:m-0 fj:font-medium">{title}</p>}
        {children && (
          <div className={cn("fj:text-[length:var(--fuji-text-sm)]", title && "fj:mt-0.5 fj:opacity-90")}>
            {children}
          </div>
        )}
      </div>
      {onDismiss && <DismissButton aria-label="Dismiss" onClick={onDismiss} className="fj:-mr-1" />}
    </div>
  );
});
