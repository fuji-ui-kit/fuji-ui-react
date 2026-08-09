import * as React from "react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface TimelineItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: React.ReactNode;
  variant?: StatusTone;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
  /**
   * "left" (default): line on the left, content to its right. "right": line on
   * the right, content to its left. "alternating": a centered line, content
   * flipping sides per item - collapses to "left" below the `sm` breakpoint,
   * since alternating needs the width a phone screen doesn't have.
   */
  layout?: "left" | "right" | "alternating";
}

const DOT_CLASSES: Record<StatusTone, string> = {
  default: "fj:bg-fuji-foreground-subtle",
  success: "fj:bg-fuji-forest",
  warning: "fj:bg-fuji-sun",
  danger: "fj:bg-fuji-fire",
  info: "fj:bg-fuji-water",
};

function TimelineContent({ item, align }: { item: TimelineItem; align: "left" | "right" }) {
  return (
    <div className={cn("fj:flex fj:flex-col fj:gap-0.5", align === "right" && "fj:items-end fj:text-right")}>
      <div className={cn("fj:flex fj:items-baseline fj:gap-2", align === "right" && "fj:flex-row-reverse")}>
        <p className="fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground">
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
  { items, layout = "left", className, ...props },
  ref,
) {
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
                {side === "left" && <TimelineContent item={item} align="left" />}
              </div>
              <div
                className={cn(
                  "fj:hidden fj:sm:flex fj:sm:flex-col fj:sm:items-center",
                  !isLast && "fj:sm:pb-5",
                )}
              >
                <span className={dotClasses} />
                {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border" />}
              </div>
              <div
                className={cn(
                  "fj:hidden fj:sm:block fj:sm:pl-4",
                  !isLast && "fj:sm:pb-5",
                  side !== "right" && "fj:sm:invisible",
                )}
              >
                {side === "right" && <TimelineContent item={item} align="right" />}
              </div>
              {/* Mobile fallback: plain left-aligned row, same as the "left" layout. */}
              <div className="fj:flex fj:gap-3 fj:sm:hidden">
                <div className="fj:flex fj:flex-col fj:items-center">
                  <span className={dotClasses} />
                  {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border" />}
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
              {!isLast && <span className="fj:w-px fj:flex-1 fj:bg-fuji-border" />}
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
