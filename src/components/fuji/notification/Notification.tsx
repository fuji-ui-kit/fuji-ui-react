import * as React from "react";
import { cn } from "../../../lib/cn";

export interface NotificationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Glyph for the leading disc - an app or category icon. Ignored when `avatar` is given. */
  icon?: React.ReactNode;
  /** The sender's `<Avatar />` (or any 40px node) in place of the icon disc. */
  avatar?: React.ReactNode;
  /**
   * A small glyph pinned to the corner of the avatar/icon - the kind of
   * event (a heart for a like, a speech bubble for a mention).
   */
  badge?: React.ReactNode;
  /** What happened, in a few words. */
  title: React.ReactNode;
  /** The detail under the title. */
  description?: React.ReactNode;
  /** When it happened - already formatted ("2h ago"), since this renders it verbatim. */
  timestamp?: React.ReactNode;
  /**
   * `"stacked"` (default): title, description, timestamp on separate lines (an alert). `"inline"`:
   * one sentence, "**Ava** liked your post · 2h" (an activity feed).
   */
  layout?: "stacked" | "inline";
  /** A thumbnail of the thing the notification is about, on the trailing edge. */
  media?: React.ReactNode;
  /** Unread: a dot on the leading edge and a bolder title. */
  unread?: boolean;
}

/**
 * Persistent row for a notification centre/inbox (`Toast` is for transient feedback). Stack rows
 * with `divide-y`, group under "Today"/"This week" headings, or card each one.
 */
export const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(function Notification(
  {
    icon,
    avatar,
    badge,
    title,
    description,
    timestamp,
    layout = "stacked",
    media,
    unread = false,
    className,
    ...props
  },
  ref,
) {
  const leading = avatar ?? icon;
  const inline = layout === "inline";
  return (
    <div
      ref={ref}
      data-unread={unread ? "" : undefined}
      className={cn(
        "fj:box-border fj:flex fj:items-center fj:gap-3 fj:rounded-fuji-panel fj:px-3 fj:py-3 fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        "fj:hover:bg-fuji-surface-subtle",
        className,
      )}
      {...props}
    >
      {/* The unread dot keeps its slot either way so rows line up. */}
      <span
        aria-hidden="true"
        className={cn(
          "fj:size-1.5 fj:shrink-0 fj:rounded-full fj:transition-opacity fj:duration-[var(--fuji-duration-fast)]",
          unread ? "fj:bg-fuji-fire" : "fj:opacity-0",
        )}
      />
      {leading && (
        <span className="fj:relative fj:shrink-0">
          {avatar ?? (
            <span className="fj:flex fj:size-10 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-raised fj:text-fuji-foreground-muted">
              {icon}
            </span>
          )}
          {badge && (
            <span className="fj:absolute fj:-top-1 fj:-right-1 fj:flex fj:size-5 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface fj:text-fuji-foreground-muted fj:shadow-fuji-control fj:[&>svg]:size-3">
              {badge}
            </span>
          )}
        </span>
      )}
      <div className="fj:min-w-0 fj:flex-1">
        {inline ? (
          <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:leading-relaxed fj:text-fuji-foreground-muted">
            <span className={cn("fj:font-semibold fj:text-fuji-foreground", unread && "fj:text-fuji-water")}>
              {title}
            </span>
            {description && <> {description}</>}
            {timestamp && (
              <span className="fj:whitespace-nowrap fj:text-fuji-foreground-subtle"> · {timestamp}</span>
            )}
          </p>
        ) : (
          <>
            <div className="fj:flex fj:items-baseline fj:justify-between fj:gap-3">
              <p
                className={cn(
                  "fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:leading-snug fj:text-fuji-foreground",
                  unread ? "fj:font-semibold" : "fj:font-medium",
                )}
              >
                {title}
              </p>
              {timestamp && (
                <span className="fj:shrink-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
                  {timestamp}
                </span>
              )}
            </div>
            {description && (
              <p className="fj:m-0 fj:mt-0.5 fj:text-[length:var(--fuji-text-sm)] fj:leading-snug fj:text-fuji-foreground-muted">
                {description}
              </p>
            )}
          </>
        )}
      </div>
      {media && (
        <span className="fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:[&>img]:size-12 fj:[&>img]:rounded-fuji-control fj:[&>img]:object-cover">
          {media}
        </span>
      )}
      {unread && <span className="fj:sr-only">Unread</span>}
    </div>
  );
});
