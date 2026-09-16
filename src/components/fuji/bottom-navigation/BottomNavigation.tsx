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
   * A count or short marker pinned to the icon's corner - unread messages,
   * pending requests.
   *
   * - A **number** renders as a count pill (`99+` above 99) and is hidden at
   *   `0`. It is announced as part of the item's name - "Chats, 3 unread" -
   *   through visually hidden text, since the pill itself means nothing out
   *   of context.
   * - Any other **node** (a short string, an icon) renders in the same pill
   *   as given. Pair it with `badgeLabel` so it is announced meaningfully.
   */
  badge?: React.ReactNode;
  /**
   * What a screen reader hears for `badge`, appended to the label after a
   * comma. Defaults to `"{count} unread"` for a numeric badge; for a
   * non-numeric badge, without this, the badge's own content is read as-is.
   * Pass a translated string ("3 non lus") or a different noun ("2 requests").
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
   * Wraps each item that has an `href` in a router link - `next/link`, a
   * TanStack `Link` - while keeping Fuji's styling on the content it is handed.
   *
   * The third argument carries what Fuji's own anchor gets: `href`,
   * `aria-current`, the link `className`, `onClick` (which reports
   * `onItemSelect`) and `children`, so `(item, children, props) => <Link {...props} />`
   * is a complete link. Returning a single element without spreading them is
   * also fine - they are applied to it for you, filling in only what it does
   * not set itself.
   */
  renderLink?: (
    item: BottomNavigationItem,
    children: React.ReactNode,
    linkProps: BottomNavigationLinkProps,
  ) => React.ReactNode;
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
      const badge = resolveBadge(item);
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
      if (renderLink) {
        // A router link gets exactly what the default anchor below gets -
        // it used to receive only the content, so `aria-current` and the
        // link reset/focus ring silently disappeared with a custom link.
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
          // `active` was purely a color change, which no screen reader
          // and no one with a color vision deficiency can perceive.
          // `aria-current="page"` is the announced equivalent.
          aria-current={item.active ? "page" : undefined}
          onClick={() => onItemSelect?.(item, index)}
          // No preflight ships with this package (see SPEC.md §8), so
          // a bare <a> keeps the browser's default underline and link
          // color unless reset explicitly here.
          className={LINK_CLASSNAME}
        >
          {content}
        </a>
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
