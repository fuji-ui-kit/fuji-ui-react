import * as React from "react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface TimelineItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: React.ReactNode;
  variant?: StatusTone;
  /**
   * Overrides the text announced for `variant` (default: "Success",
   * "Warning", "Error", "Info"). Pass a translated string, or `""` to
   * suppress it where the title already says what happened.
   */
  statusLabel?: string;
}

export interface TimelineGroup {
  /** The heading on the axis - a year, a quarter, a release. */
  label: React.ReactNode;
  /** Optional media for the left column: an image with its caption, a card, ... */
  media?: React.ReactNode;
  /** The group's entries, listed down the right column. */
  items: TimelineItem[];
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  /** The entries, newest first by convention. Optional when `groups` is given instead. */
  items?: TimelineItem[];
  /**
   * "left" (default): line on the left, content to its right. "right": line on
   * the right, content to its left. "alternating": a centered line, content
   * flipping sides per item - collapses to "left" below the `sm` breakpoint,
   * since alternating needs the width a phone screen doesn't have.
   */
  layout?: "left" | "right" | "alternating";
  /**
   * A history timeline: each group's `label` sits centred on a vertical axis
   * with a dot beneath it, its `media` on the left and its `items` listed on
   * the right (timestamp, then title). Replaces `items`/`layout` when given.
   * Collapses to a single column below the `sm` breakpoint.
   */
  groups?: TimelineGroup[];
}

const DOT_CLASSES: Record<StatusTone, string> = {
  default: "fj:bg-fuji-foreground-subtle",
  success: "fj:bg-fuji-forest",
  warning: "fj:bg-fuji-sun",
  danger: "fj:bg-fuji-fire",
  info: "fj:bg-fuji-water",
};

/**
 * `variant` paints the dot and nothing else, so "this step failed" was carried
 * entirely by a 10px colored circle - invisible to a screen reader and to
 * anyone who can't separate the red from the green. This is the text half of
 * that signal, read out before the entry's own title.
 */
const STATUS_LABELS: Record<StatusTone, string> = {
  default: "",
  success: "Success",
  warning: "Warning",
  danger: "Error",
  info: "Info",
};

function TimelineContent({ item, align }: { item: TimelineItem; align: "left" | "right" }) {
  const status = item.statusLabel ?? STATUS_LABELS[item.variant ?? "default"];
  return (
    <div className={cn("fj:flex fj:flex-col fj:gap-0.5", align === "right" && "fj:items-end fj:text-right")}>
      <div className={cn("fj:flex fj:items-baseline fj:gap-2", align === "right" && "fj:flex-row-reverse")}>
        <p className="fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground">
          {status && <span className="fj:sr-only">{status}: </span>}
          {item.title}
        </p>
        {item.timestamp && (
          <span className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
            {item.timestamp}
          </span>
        )}
      </div>
      {item.description && (
        <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
          {item.description}
        </p>
      )}
    </div>
  );
}

/** Vertical event timeline - connecting line with a dot per entry. */
export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { items = [], groups, layout = "left", className, ...props },
  ref,
) {
  if (groups) {
    return (
      <ol
        ref={ref}
        className={cn("fj:m-0 fj:box-border fj:flex fj:list-none fj:flex-col fj:p-0", className)}
        {...props}
      >
        {groups.map((group, groupIndex) => {
          const heading = (
            <h3 className="fj:m-0 fj:text-[length:var(--fuji-text-2xl)] fj:leading-none fj:font-semibold fj:tracking-tight fj:text-fuji-foreground">
              {group.label}
            </h3>
          );
          return (
            <li
              key={groupIndex}
              className="fj:relative fj:flex fj:flex-col fj:gap-4 fj:pb-10 fj:pl-8 fj:last:pb-0 fj:sm:grid fj:sm:grid-cols-[1fr_1fr] fj:sm:gap-x-12 fj:sm:pl-0"
            >
              {/*
                The axis column - dot, then the line down to the next group -
                is positioned over the whole group so the line can stretch to
                its full height. From `sm` up an invisible copy of the heading
                sits above the dot so it lands just beneath the real heading,
                which is centred in the normal flow beside it.
              */}
              <div
                aria-hidden="true"
                className="fj:absolute fj:inset-y-0 fj:left-0 fj:flex fj:w-2.5 fj:flex-col fj:items-center fj:sm:left-1/2 fj:sm:w-auto fj:sm:-translate-x-1/2"
              >
                <span className="fj:invisible fj:hidden fj:sm:block">{heading}</span>
                <span className="fj:mt-2 fj:size-2.5 fj:shrink-0 fj:rounded-full fj:bg-fuji-foreground" />
                {groupIndex < groups.length - 1 && (
                  <span className="fj:mt-2 fj:w-px fj:flex-1 fj:bg-fuji-border-strong" />
                )}
              </div>
              <div className="fj:sm:col-span-2 fj:sm:text-center">{heading}</div>
              {group.media && (
                <div className="fj:flex fj:flex-col fj:sm:items-end fj:sm:text-right">{group.media}</div>
              )}
              <ol
                className={cn(
                  "fj:m-0 fj:flex fj:list-none fj:flex-col fj:gap-2.5 fj:p-0",
                  !group.media && "fj:sm:col-start-2",
                )}
              >
                {group.items.map((item, itemIndex) => {
                  const status = item.statusLabel ?? STATUS_LABELS[item.variant ?? "default"];
                  return (
                    <li key={itemIndex} className="fj:flex fj:items-baseline fj:gap-3">
                      {item.timestamp !== undefined && (
                        <span className="fj:w-8 fj:shrink-0 fj:text-[length:var(--fuji-text-sm)] fj:font-semibold fj:tabular-nums fj:text-fuji-foreground-muted">
                          {item.timestamp}
                        </span>
                      )}
                      <div className="fj:flex fj:min-w-0 fj:flex-col fj:gap-0.5">
                        <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground">
                          {status && <span className="fj:sr-only">{status}: </span>}
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="fj:m-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    );
  }

  if (layout === "alternating") {
    return (
      <ol
        ref={ref}
        className={cn(
          "fj:m-0 fj:box-border fj:flex fj:list-none fj:flex-col fj:p-0 fj:sm:grid fj:sm:grid-cols-[1fr_auto_1fr]",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const side = index % 2 === 0 ? "left" : "right";
          const dotClasses = cn(
            "fj:mt-1.5 fj:size-2.5 fj:shrink-0 fj:rounded-full",
            DOT_CLASSES[item.variant ?? "default"],
          );
          return (
            // `contents` drops this <li>'s own box so its cells lay out
            // directly as the parent grid's row (each becomes a genuine grid
            // item, which is required for the middle cell's connecting line -
            // a `flex-1` span - to stretch against the grid's own row height;
            // an extra wrapper div in between would only size to its own
            // content instead). It still marks up as a real list item for
            // assistive tech.
            <li key={index} className="fj:flex fj:gap-3 fj:sm:contents">
              <div
                className={cn(
                  "fj:hidden fj:sm:block fj:sm:pr-4",
                  !isLast && "fj:sm:pb-5",
                  side !== "left" && "fj:sm:invisible",
                )}
              >
                {/*
                  Right-aligned, in the LEFT column. Both columns align toward
                  the centre axis, which is what makes an alternating timeline
                  read as one thread: aligning each side outward (as this did)
                  leaves a 300px gap between the text and the dot it belongs
                  to, and the eye stops connecting them.
                */}
                {side === "left" && <TimelineContent item={item} align="right" />}
              </div>
              <div className="fj:hidden fj:sm:flex fj:sm:flex-col fj:sm:items-center">
                {/*
                  No `pb-5` here, unlike the two content columns. This column's
                  job is to span the row, and bottom padding on it stopped the
                  connecting line ~20px short of the next dot - the thread
                  rendered as a series of disconnected dashes.
                */}
                <span className={dotClasses} />
                {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border-strong" />}
              </div>
              <div
                className={cn(
                  "fj:hidden fj:sm:block fj:sm:pl-4",
                  !isLast && "fj:sm:pb-5",
                  side !== "right" && "fj:sm:invisible",
                )}
              >
                {side === "right" && <TimelineContent item={item} align="left" />}
              </div>
              {/* Mobile fallback: plain left-aligned row, same as the "left" layout. */}
              <div className="fj:flex fj:gap-3 fj:sm:hidden">
                <div className="fj:flex fj:flex-col fj:items-center">
                  <span className={dotClasses} />
                  {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border-strong" />}
                </div>
                <div className={cn(!isLast && "fj:pb-5")}>
                  <TimelineContent item={item} align="left" />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      ref={ref}
      className={cn("fj:box-border fj:m-0 fj:flex fj:list-none fj:flex-col fj:p-0", className)}
      {...props}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={index} className={cn("fj:flex fj:gap-3", layout === "right" && "fj:flex-row-reverse")}>
            <div className="fj:flex fj:flex-col fj:items-center">
              <span
                className={cn(
                  "fj:mt-1.5 fj:size-2.5 fj:shrink-0 fj:rounded-full",
                  DOT_CLASSES[item.variant ?? "default"],
                )}
              />
              {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border-strong" />}
            </div>
            <div className={cn(!isLast && "fj:pb-5")}>
              <TimelineContent item={item} align={layout === "right" ? "right" : "left"} />
            </div>
          </li>
        );
      })}
    </ol>
  );
});
