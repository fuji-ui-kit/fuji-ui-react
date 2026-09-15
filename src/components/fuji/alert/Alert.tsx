import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";
import { DismissButton } from "../lib/dismiss-button";
import {
  STATUS_ICON_TILE_CLASS,
  STATUS_ICON_TONE,
  STATUS_WASH,
  STATUS_WASH_CLASS,
} from "../lib/status-surface";

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Status the message reports; sets the tone wash, the icon and the ARIA role. */
  variant?: StatusTone;
  /** Headline above the body. */
  title?: React.ReactNode;
  /** Renders a dismiss button and is called when it is pressed. Removing the alert is the consumer's job. */
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
        "fj:relative fj:flex fj:items-start fj:gap-3 fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-[var(--fuji-panel-p)] fj:text-[length:var(--fuji-text-base)] fj:shadow-fuji-card",
        className,
      )}
      {...props}
    >
      {/* Tone wash and icon tile: the shared status treatment, so an alert and
          a toast of the same variant read as the same thing. */}
      <span aria-hidden="true" className={cn(STATUS_WASH_CLASS, STATUS_WASH[variant])} />
      <span className={STATUS_ICON_TILE_CLASS}>
        <Icon className={cn("fj:size-[18px]", STATUS_ICON_TONE[variant])} aria-hidden="true" />
      </span>
      <div className="fj:relative fj:min-w-0 fj:flex-1">
        {title && <p className="fj:m-0 fj:font-semibold fj:text-fuji-foreground">{title}</p>}
        {children && (
          <div
            className={cn(
              "fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted",
              title && "fj:mt-0.5",
            )}
          >
            {children}
          </div>
        )}
      </div>
      {onDismiss && (
        <DismissButton aria-label="Dismiss" onClick={onDismiss} className="fj:relative fj:-mr-1" />
      )}
    </div>
  );
});
