import * as React from "react";
import { cn } from "../../../lib/cn";

export interface DescriptionListItem {
  term: React.ReactNode;
  description: React.ReactNode;
}

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  /** The term/description pairs, in display order. */
  items: DescriptionListItem[];
  /** `2` renders term/description side by side; `1` stacks them. */
  columns?: 1 | 2;
}

/** Term/description pairs - for spec sheets, settings summaries, metadata panels. */
export const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  function DescriptionList({ items, columns = 2, className, ...props }, ref) {
    return (
      <dl ref={ref} className={cn("fj:m-0 fj:divide-y fj:divide-fuji-border", className)} {...props}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "fj:py-3",
              columns === 2 ? "fj:grid fj:grid-cols-3 fj:gap-4" : "fj:flex fj:flex-col fj:gap-1",
            )}
          >
            <dt
              className={cn(
                "fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted",
                columns === 2 && "fj:col-span-1",
              )}
            >
              {item.term}
            </dt>
            <dd
              className={cn(
                "fj:ml-0 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground",
                columns === 2 && "fj:col-span-2",
              )}
            >
              {item.description}
            </dd>
          </div>
        ))}
      </dl>
    );
  },
);
