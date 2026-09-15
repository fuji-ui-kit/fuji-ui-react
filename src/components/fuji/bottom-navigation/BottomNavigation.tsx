import * as React from "react";
import { cn } from "../../../lib/cn";
import { safeHref } from "../lib/safe-href";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface BottomNavigationItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** The tabs, in display order. */
  items: BottomNavigationItem[];
  /**
   * Wraps each item in a router link - `next/link`, a TanStack `Link` - while
   * keeping Fuji's styling on the content it is handed.
   */
  renderLink?: (item: BottomNavigationItem, children: React.ReactNode) => React.ReactNode;
  /**
   * Called when an item is chosen. Without this, an item with no `href` was
   * inert markup - the bar could only be driven by navigation, so a tab bar
   * switching a local view had no way to report the choice. `Navbar` has taken
   * the same callback since 0.2; this brings the two into line.
   *
   * Items with an `href` still navigate; this fires alongside.
   */
  onItemSelect?: (item: BottomNavigationItem, index: number) => void;
  /**
   * How the bar is positioned.
   *
   * - `"sticky"` (default) pins to the bottom of its own scroll container -
   *   the page when rendered at the end of `<body>`, a panel when rendered
   *   inside one. It stays where it was put.
   * - `"fixed"` pins to the viewport regardless of where it is rendered -
   *   this was the only behaviour before 0.3.0, and it meant the bar escaped
   *   every container it was placed in (a phone-frame demo, a split view) and
   *   could not be overridden via `className`, because the positioning class
   *   lives in Fuji's own cascade layer and wins over a consumer's.
   * - `"absolute"` for a `position: relative` parent that should contain it.
   * - `"static"` for layouts that place it themselves.
   */
  position?: "sticky" | "fixed" | "absolute" | "static";
  /**
   * A raised primary action in the middle of the bar, sitting in a notch cut
   * from the bar's edge (the floating tab bar of the reference designs). The
   * items split evenly either side of it. Rendered as a `<button>`; give it
   * an `aria-label` since it is icon-only.
   */
  action?: {
    icon: React.ReactNode;
    "aria-label": string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  };
  /**
   * `"floating"` detaches the bar from the edge: inset, fully rounded, and
   * cast with the panel shadow rather than sitting flush with a top border.
   * Default `"bar"`.
   */
  variant?: "bar" | "floating";
  /**
   * How the active item is marked, beyond its colour.
   *
   * - `"none"` (default) - colour only, as before.
   * - `"dot"` - a small dot under the label.
   * - `"pill"` - a filled pill behind the whole item.
   * - `"circle"` - a filled disc behind the icon only, label left plain.
   *
   * Colour alone is not a sufficient indicator on its own (WCAG 1.4.1), so
   * every item also carries `aria-current="page"`; these add a visible,
   * non-colour cue on top of that.
   */
  indicator?: "none" | "dot" | "pill" | "circle";
}

const POSITION_CLASSES: Record<NonNullable<BottomNavigationProps["position"]>, string> = {
  sticky: "fj:sticky fj:bottom-0",
  fixed: "fj:fixed fj:inset-x-0 fj:bottom-0",
  absolute: "fj:absolute fj:inset-x-0 fj:bottom-0",
  static: "fj:static",
};

/** Mobile tab bar pinned to the bottom of its container, with safe-area padding. */
export const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  function BottomNavigation(
    {
      items,
      renderLink,
      onItemSelect,
      position = "sticky",
      action,
      variant = "bar",
      indicator = "none",
      className,
      ...props
    },
    ref,
  ) {
    // With an action, the items split around it so it sits on the centre.
    const half = Math.ceil(items.length / 2);
    const renderItem = (item: BottomNavigationItem, index: number) => {
      const pill = indicator === "pill" && item.active;
      const circle = indicator === "circle" && item.active;
      const content = (
        <span
          className={cn(
            "fj:flex fj:flex-1 fj:flex-col fj:items-center fj:justify-center fj:gap-0.5 fj:py-2 fj:text-[length:var(--fuji-text-2xs)] fj:font-medium fj:leading-tight",
            // Full class strings, never templated - Tailwind's scanner is static.
            pill && "fj:mx-1 fj:rounded-full fj:bg-fuji-default fj:px-3 fj:text-fuji-default-foreground",
            // `indicator="none"` (the default) told active from inactive with
            // colour alone - `text-fuji-foreground` vs `-subtle` at the same
            // 500 weight and 11px size - which measured as little as ~1.9:1
            // between the two, the weakest active/inactive split in the
            // package (`dot`/`pill`/`circle` all read ~14:1, because they add
            // a literal mark or fill on top of the same colour swap). Rather
            // than invent a fourth token or blur `"none"` into `"dot"` with a
            // mark, adding weight gives it a second, non-colour axis: bold
            // reads as "current" even to someone who can't distinguish the
            // two ink shades, at zero API cost.
            !pill &&
              (item.active ? "fj:font-semibold fj:text-fuji-foreground" : "fj:text-fuji-foreground-subtle"),
          )}
        >
          <span
            className={cn(
              "fj:flex fj:size-[18px] fj:items-center fj:justify-center fj:[&_svg]:size-[18px]",
              circle &&
                "fj:box-border fj:size-7 fj:rounded-full fj:bg-fuji-default fj:text-fuji-default-foreground",
            )}
          >
            {item.icon}
          </span>
          {item.label}
          {indicator === "dot" && (
            <span
              aria-hidden="true"
              className={cn(
                "fj:mt-0.5 fj:size-1 fj:rounded-full",
                item.active ? "fj:bg-fuji-default" : "fj:bg-transparent",
              )}
            />
          )}
        </span>
      );
      // `href ?? label` rather than the array index: an index key makes
      // React reuse the wrong DOM node when items are filtered or
      // reordered (a permissions-dependent tab bar), which strands the
      // previous item's icon and focus on the new label.
      const key = item.href ?? `${item.label}-${index}`;
      if (!item.href) {
        // With a handler the item has to be a real control: a bare <span> is
        // not focusable and cannot be activated from the keyboard, so a tab
        // bar driving local state was mouse-only.
        if (onItemSelect) {
          return (
            <button
              key={key}
              type="button"
              aria-current={item.active ? "page" : undefined}
              onClick={() => onItemSelect(item, index)}
              className={cn(
                NATIVE_CONTROL_RESET,
                "fj:flex fj:flex-1 fj:cursor-pointer fj:text-inherit",
                "fj:focus-visible:outline-2 fj:focus-visible:-outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
              )}
            >
              {content}
            </button>
          );
        }
        return <React.Fragment key={key}>{content}</React.Fragment>;
      }
      return (
        <React.Fragment key={key}>
          {renderLink ? (
            renderLink(item, content)
          ) : (
            <a
              href={safeHref(item.href)}
              // `active` was purely a color change, which no screen reader
              // and no one with a color vision deficiency can perceive.
              // `aria-current="page"` is the announced equivalent.
              aria-current={item.active ? "page" : undefined}
              onClick={() => onItemSelect?.(item, index)}
              // No preflight ships with this package (see SPEC.md §8), so
              // a bare <a> keeps the browser's default underline and link
              // color unless reset explicitly here.
              className="fj:flex fj:flex-1 fj:cursor-pointer fj:text-inherit fj:no-underline fj:focus-visible:outline-2 fj:focus-visible:-outline-offset-2 fj:focus-visible:outline-fuji-focus-ring"
            >
              {content}
            </a>
          )}
        </React.Fragment>
      );
    };

    return (
      <nav
        ref={ref}
        // A page almost always has more than one landmark of this role once a
        // Navbar or Sidebar is also on screen, and screen-reader landmark
        // menus then list several indistinguishable "navigation" entries.
        // Named by default, still overridable through the spread below.
        aria-label="Main"
        className={cn(
          "fj:relative fj:z-40",
          variant === "floating" && "fj:mx-4 fj:mb-[max(1rem,env(safe-area-inset-bottom))]",
          POSITION_CLASSES[position],
          className,
        )}
        {...props}
      >
        {/*
          The visible bar is an inner element so the notch mask (see
          `.fuji-bottom-nav-notched`) clips the surface but not the action
          button, which is rendered as this element's sibling below.
        */}
        <div
          className={cn(
            "fuji-glass-surface fj:flex fj:items-stretch fj:justify-around fj:bg-fuji-surface-overlay",
            variant === "floating"
              ? "fuji-bottom-nav-floating fj:rounded-full fj:shadow-fuji-panel"
              : "fj:border-t fj:border-fuji-border fj:pb-[env(safe-area-inset-bottom)]",
            action && "fuji-bottom-nav-notched",
          )}
        >
          {action ? (
            <>
              {items.slice(0, half).map(renderItem)}
              <span className="fuji-bottom-nav-slot" aria-hidden="true" />
              {items.slice(half).map(renderItem)}
            </>
          ) : (
            items.map(renderItem)
          )}
        </div>
        {action && (
          <button
            type="button"
            aria-label={action["aria-label"]}
            onClick={action.onClick}
            className={cn(
              NATIVE_CONTROL_RESET,
              "fuji-bottom-nav-action fuji-raised fj:flex fj:size-14 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
              "fj:transition-[transform,box-shadow] fj:duration-[var(--fuji-duration-fast)] fj:active:scale-[var(--fuji-press-scale)]",
              "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
            )}
          >
            {action.icon}
          </button>
        )}
      </nav>
    );
  },
);
