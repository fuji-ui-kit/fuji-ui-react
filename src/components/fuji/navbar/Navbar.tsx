import * as React from "react";
import { cn } from "../../../lib/cn";
import { isSafeHref } from "../lib/safe-href";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface NavbarItem {
  label: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  items: NavbarItem[];
  renderLink?: (item: NavbarItem, children: React.ReactNode) => React.ReactNode;
  onItemSelect?: (item: NavbarItem, index: number) => void;
  /** Additional classes applied to each item's inner label span (e.g. to override its text size). */
  itemClassName?: string;
}

/** Horizontal row of nav links with an active-state underline. */
export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(function Navbar(
  { items, renderLink, onItemSelect, itemClassName, className, ...props },
  ref,
) {
  return (
    <nav ref={ref} className={cn("fj:flex fj:items-center fj:gap-1", className)} {...props}>
      {items.map((item, index) => {
        const content = (
          <span
            className={cn(
              "fj:flex fj:h-9 fj:cursor-pointer fj:items-center fj:rounded-fuji-control fj:px-3 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
              item.active
                ? "fj:bg-fuji-default fj:text-fuji-default-foreground fj:shadow-fuji-control"
                : "fj:text-fuji-foreground-muted fj:hover:bg-fuji-surface-subtle fj:hover:text-fuji-foreground",
              itemClassName,
            )}
          >
            {item.label}
          </span>
        );
        if (!item.href && onItemSelect) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onItemSelect(item, index)}
              className={cn(
                NATIVE_CONTROL_RESET,
                "fj:cursor-pointer fj:rounded-fuji-control fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
              )}
            >
              {content}
            </button>
          );
        }
        if (!item.href) return <React.Fragment key={index}>{content}</React.Fragment>;
        return (
          <React.Fragment key={index}>
            {renderLink ? (
              renderLink(item, content)
            ) : (
              <a
                href={isSafeHref(item.href) ? item.href : undefined}
                className="fj:rounded-fuji-control fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring"
              >
                {content}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
});
