import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../../lib/cn";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Glyph shown in the circle above the title. Falls back to an inbox icon. */
  icon?: React.ReactNode;
  /** The headline - what is missing, in a few words. */
  title: React.ReactNode;
  /** A supporting line under the title, width-capped so it stays readable. */
  description?: React.ReactNode;
  /** Controls under the text - typically the one Button that fills the emptiness. */
  action?: React.ReactNode;
}

/** Centered icon + message + optional action - for empty lists, tables, and search results. */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "fj:box-border fj:flex fj:flex-col fj:items-center fj:gap-2 fj:py-12 fj:text-center",
        className,
      )}
      {...props}
    >
      <div className="fj:mb-1 fj:flex fj:size-11 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-raised fj:text-fuji-foreground-muted">
        {icon ?? <Inbox className="fj:size-5" />}
      </div>
      <p className="fj:m-0 fj:text-[length:var(--fuji-text-md)] fj:font-semibold fj:text-fuji-foreground">
        {title}
      </p>
      {description && (
        <p className="fj:m-0 fj:max-w-sm fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
          {description}
        </p>
      )}
      {action && <div className="fj:mt-2">{action}</div>}
    </div>
  );
});
