import * as React from "react";
import { cn } from "../../../lib/cn";
import { isSafeHref } from "../lib/safe-href";

export interface BottomNavigationItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: BottomNavigationItem[];
  renderLink?: (item: BottomNavigationItem, children: React.ReactNode) => React.ReactNode;
}

/** Mobile tab bar, fixed to the viewport bottom with safe-area padding. */
export const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  function BottomNavigation({ items, renderLink, className, ...props }, ref) {
    return (
      <nav
        ref={ref}
        className={cn(
          "fuji-glass-surface fj:fixed fj:inset-x-0 fj:bottom-0 fj:z-40 fj:flex fj:items-stretch fj:justify-around fj:border-t fj:border-fuji-border fj:bg-fuji-surface-overlay fj:pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => {
          const content = (
            <span
              className={cn(
                "fj:flex fj:flex-1 fj:flex-col fj:items-center fj:justify-center fj:gap-0.5 fj:py-2 fj:text-[length:var(--fuji-text-xs)] fj:font-medium",
                item.active ? "fj:text-fuji-foreground" : "fj:text-fuji-foreground-subtle",
              )}
            >
              <span className="fj:flex fj:size-5 fj:items-center fj:justify-center">{item.icon}</span>
              {item.label}
            </span>
          );
          if (!item.href) return <React.Fragment key={index}>{content}</React.Fragment>;
          return (
            <React.Fragment key={index}>
              {renderLink ? (
                renderLink(item, content)
              ) : (
                <a
                  href={isSafeHref(item.href) ? item.href : undefined}
                  // No preflight ships with this package (see SPEC.md §8), so
                  // a bare <a> keeps the browser's default underline and link
                  // color unless reset explicitly here.
                  className="fj:flex fj:flex-1 fj:cursor-pointer fj:no-underline fj:focus-visible:outline-2 fj:focus-visible:-outline-offset-2 fj:focus-visible:outline-fuji-focus-ring"
                >
                  {content}
                </a>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  },
);
