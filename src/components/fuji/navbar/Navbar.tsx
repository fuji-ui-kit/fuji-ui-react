import * as React from "react";
import { cn } from "../../../lib/cn";
import { safeHref } from "../lib/safe-href";
import { NATIVE_CONTROL_RESET, NATIVE_LINK_RESET } from "../lib/native-control-reset";

export interface NavbarItem {
  /** What the link reads as. */
  label: React.ReactNode;
  /** Destination. Without one the item renders as a button, driven by `onItemSelect`. */
  href?: string;
  /** Marks the current page; sets `aria-current="page"` as well as the active styling. */
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** The links, in display order. */
  items: NavbarItem[];
  /**
   * Wraps each item in a router link - `next/link`, a TanStack `Link` - while
   * keeping Fuji's styling on the content it is handed.
   */
  renderLink?: (item: NavbarItem, children: React.ReactNode) => React.ReactNode;
  /** Called when an item is activated. An item with no `href` needs this to do anything. */
  onItemSelect?: (item: NavbarItem, index: number) => void;
  /** Additional classes applied to each item's inner label span (e.g. to override its text size). */
  itemClassName?: string;
}

/** Horizontal row of nav links; the active one renders as a raised object. */
export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(function Navbar(
  { items, renderLink, onItemSelect, itemClassName, className, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      // Defaulted so a page with more than one navigation landmark (a Navbar
      // plus a Sidebar or BottomNavigation) doesn't present a screen reader
      // with several identically-named "navigation" entries. Overridable via
      // the spread below.
      aria-label="Main"
      className={cn("fj:flex fj:items-center fj:gap-1", className)}
      {...props}
    >
      {items.map((item, index) => {
        const interactive = Boolean(item.href) || Boolean(onItemSelect);
        const content = (
          <span
            className={cn(
              // `box-border`: without preflight, `h-9` plus the active state's border
              // made the selected item taller than its siblings.
              "fj:box-border fj:flex fj:h-9 fj:items-center fj:rounded-fuji-control fj:px-3 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
              // Only the ones that actually do something get the pointer and
              // the hover response. A plain label with neither `href` nor
              // `onItemSelect` used to render as a hand cursor over a hover
              // highlight and then do nothing when clicked.
              interactive && "fj:cursor-pointer",
              item.active
                ? "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground"
                : cn(
                    "fj:text-fuji-foreground-muted",
                    interactive && "fj:hover:bg-fuji-surface-subtle fj:hover:text-fuji-foreground",
                  ),
              itemClassName,
            )}
          >
            {item.label}
          </span>
        );
        // A stable key: `href` when there is one, else the label's text if it
        // is a plain string. An index key makes React reuse the wrong node
        // when a conditional item appears or disappears mid-list.
        const key = item.href ?? (typeof item.label === "string" ? item.label : index);
        if (!item.href && onItemSelect) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => onItemSelect(item, index)}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                NATIVE_CONTROL_RESET,
                "fj:cursor-pointer fj:rounded-fuji-control fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
              )}
            >
              {content}
            </button>
          );
        }
        if (!item.href) return <React.Fragment key={key}>{content}</React.Fragment>;
        return (
          <React.Fragment key={key}>
            {renderLink ? (
              renderLink(item, content)
            ) : (
              <a
                href={safeHref(item.href)}
                // The active item was distinguished by color alone; this is
                // the part a screen reader can announce.
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  NATIVE_LINK_RESET,
                  "fj:rounded-fuji-control fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
                )}
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
