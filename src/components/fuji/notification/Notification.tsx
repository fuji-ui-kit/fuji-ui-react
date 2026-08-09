import * as React from "react";
import { cn } from "../../../lib/cn";

export interface NotificationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: React.ReactNode;
  unread?: boolean;
}

/** Persistent list row for a notification center/inbox - see `Toast` for transient feedback. */
export const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(function Notification(
  { icon, title, description, timestamp, unread = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "fj:box-border fj:flex fj:items-start fj:gap-3 fj:rounded-fuji-panel fj:px-3 fj:py-2.5 fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        unread ? "fj:bg-fuji-surface-strong" : "fj:hover:bg-fuji-surface-subtle",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="fj:mt-0.5 fj:flex fj:size-8 fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-strong fj:text-fuji-foreground-muted">
          {icon}
        </span>
      )}
      <div className="fj:min-w-0 fj:flex-1">
        <div className="fj:flex fj:items-start fj:justify-between fj:gap-2">
          <p className="fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground">
            {title}
          </p>
          {unread && (
            <span
              className="fj:mt-1.5 fj:size-1.5 fj:shrink-0 fj:rounded-full fj:bg-fuji-water"
              aria-hidden="true"
            />
          )}
        </div>
        {description && (
          <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
            {description}
          </p>
        )}
        {timestamp && (
          <p className="fj:mt-0.5 fj:mb-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
});
