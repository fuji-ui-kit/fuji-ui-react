import * as React from "react";
import { cn } from "../../../lib/cn";
import { safeHref } from "../lib/safe-href";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { applyLinkProps, type NavigationLinkProps } from "../lib/link-props";

export interface BottomNavigationItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  /**
   * Count or marker on the icon's corner. A number shows as a pill (`99+` above 99, hidden at `0`),
   * announced as "Chats, 3 unread"; any other node renders as given - pair it with `badgeLabel`.
   */
  badge?: React.ReactNode;
  /**
   * What a screen reader hears for `badge`, appended after a comma. Defaults to `"{count} unread"`
   * for a numeric badge; a non-numeric one is read as-is. Pass a translated string ("3 non lus").
   */
  badgeLabel?: string;
}

/** The props Fuji's own anchor receives, passed to `renderLink` as its third argument. */
export type BottomNavigationLinkProps = NavigationLinkProps;

const LINK_CLASSNAME =
  "fj:flex fj:flex-1 fj:cursor-pointer fj:text-inherit fj:no-underline fj:focus-visible:outline-2 fj:focus-visible:-outline-offset-2 fj:focus-visible:outline-fuji-focus-ring";

/** Whether `badge` renders at all, and the hidden text announced for it (if any). */
function resolveBadge({ badge, badgeLabel }: Pick<BottomNavigationItem, "badge" | "badgeLabel">) {
  if (badge === undefined || badge === null || badge === false || badge === true || badge === "") {
    return { shown: false, announced: undefined };
  }
  const numeric = typeof badge === "number";
  if (numeric && !(badge > 0)) return { shown: false, announced: undefined };
  return { shown: true, announced: badgeLabel ?? (numeric ? `${badge} unread` : undefined) };
}

function BottomNavigationBadge({ badge, announced }: { badge: React.ReactNode; announced?: string }) {
  const numeric = typeof badge === "number";
  return (
    <span
      // Hidden only when there is replacement text below; a bare node badge
      // with no `badgeLabel` is read as-is rather than silently dropped.
      aria-hidden={announced !== undefined ? true : undefined}
      className="fj:pointer-events-none fj:absolute fj:-top-1.5 fj:left-[calc(100%-0.5rem)] fj:box-border fj:flex fj:h-4 fj:min-w-4 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-fire fj:px-1 fj:text-[length:var(--fuji-text-2xs)] fj:leading-none fj:font-semibold fj:tabular-nums fj:text-fuji-fire-foreground fj:ring-2 fj:ring-fuji-surface-overlay"
    >
      {numeric ? (badge > 99 ? "99+" : badge) : badge}
    </span>
  );
}

export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** The tabs, in display order. */
  items: BottomNavigationItem[];
  /**
   * Wraps each `href` item in a router link. The third argument holds Fuji's anchor props (`href`,
   * `aria-current`, `className`, `onClick`, `children`); spread them or they are merged in for you.
   */
  renderLink?: (
    item: BottomNavigationItem,
    children: React.ReactNode,
    linkProps: BottomNavigationLinkProps,
  ) => React.ReactNode;
  /**
   * Called when an item is chosen, so a tab bar switching local view state can report the choice
   * (same as `Navbar`). Items with an `href` still navigate; this fires alongside.
   */
  onItemSelect?: (item: BottomNavigationItem, index: number) => void;
  /**
   * `"sticky"` (default) pins to its scroll container's bottom; `"fixed"` to the viewport, escaping
   * any container; `"absolute"` for a `position: relative` parent; `"static"` for manual layouts.
   */
  position?: "sticky" | "fixed" | "absolute" | "static";
  /**
   * A raised primary action centred in a notch cut from the bar, items split evenly either side.
   * Rendered as a `<button>`; give it an `aria-label` since it is icon-only.
   */
  action?: {
    icon: React.ReactNode;
    "aria-label": string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  };
  /**
   * `"floating"` detaches the bar: inset, fully rounded, with the panel shadow instead of a top
   * border. Default `"bar"`.
   */
  variant?: "bar" | "floating";
  /**
   * Non-colour active cue: `"none"` (default), `"dot"` under the label, `"pill"` behind the item,
   * `"circle"` behind the icon. Active items also get `aria-current="page"` (WCAG 1.4.1).
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
      const badge = resolveBadge(item);
      const pill = indicator === "pill" && item.active;
      const circle = indicator === "circle" && item.active;
      const content = (
        <span
          className={cn(
            "fj:flex fj:flex-1 fj:flex-col fj:items-center fj:justify-center fj:gap-0.5 fj:py-2 fj:text-[length:var(--fuji-text-2xs)] fj:font-medium fj:leading-tight",
            // Full class strings, never templated - Tailwind's scanner is static.
            pill && "fj:mx-1 fj:rounded-full fj:bg-fuji-default fj:px-3 fj:text-fuji-default-foreground",
            // Colour alone measured ~1.9:1 between active and inactive ink (dot/pill/circle read
            // ~14:1); bold weight adds a non-colour cue to `"none"` at zero API cost.
            !pill &&
              (item.active ? "fj:font-semibold fj:text-fuji-foreground" : "fj:text-fuji-foreground-subtle"),
          )}
        >
          <span
            className={cn(
              "fj:relative fj:flex fj:size-[18px] fj:items-center fj:justify-center fj:[&_svg]:size-[18px]",
              circle &&
                "fj:box-border fj:size-7 fj:rounded-full fj:bg-fuji-default fj:text-fuji-default-foreground",
            )}
          >
            {item.icon}
            {badge.shown && <BottomNavigationBadge badge={item.badge} announced={badge.announced} />}
          </span>
          {item.label}
          {/* After the label, so the name reads "Chats, 3 unread" rather than
              leading with the count. */}
          {badge.announced !== undefined && <span className="fj:sr-only">, {badge.announced}</span>}
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
      // `href ?? label`, not the index: index keys reuse the wrong DOM node when items are
      // filtered or reordered, stranding the old icon and focus on the new label.
      const key = item.href ?? `${item.label}-${index}`;
      if (!item.href) {
        // With a handler the item must be a real control; a bare <span> is not keyboard-operable.
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
      if (renderLink) {
        // Router links get the same props as the default anchor, so `aria-current` and the
        // link reset/focus ring survive a custom link.
        const linkProps: BottomNavigationLinkProps = {
          href: item.href,
          "aria-current": item.active ? "page" : undefined,
          className: LINK_CLASSNAME,
          onClick: onItemSelect ? () => onItemSelect(item, index) : undefined,
          children: content,
        };
        return (
          <React.Fragment key={key}>
            {applyLinkProps(renderLink(item, content, linkProps), linkProps)}
          </React.Fragment>
        );
      }
      return (
        <a
          key={key}
          href={safeHref(item.href)}
          // `active` is otherwise only a colour change; `aria-current="page"` announces it.
          aria-current={item.active ? "page" : undefined}
          onClick={() => onItemSelect?.(item, index)}
          // No preflight ships (SPEC.md §8), so a bare <a> needs its underline/colour reset here.
          className={LINK_CLASSNAME}
        >
          {content}
        </a>
      );
    };

    return (
      <nav
        ref={ref}
        // Pages usually have several navigation landmarks (Navbar, Sidebar); name this one by
        // default so landmark menus can tell them apart. Overridable through the spread below.
        aria-label="Main"
        className={cn(
          "fj:relative fj:z-40",
          variant === "floating" && "fj:mx-4 fj:mb-[max(1rem,env(safe-area-inset-bottom))]",
          POSITION_CLASSES[position],
          className,
        )}
        {...props}
      >
        {/* Inner bar so the notch mask (`.fuji-bottom-nav-notched`) clips the surface but not the
            action button, rendered as its sibling below. */}
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
              {/* Offset back to `items` indices: `map` over a slice counts from 0, which made
                  `onItemSelect` report the item two places early on the far side of the action. */}
              {items.slice(half).map((item, index) => renderItem(item, index + half))}
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
