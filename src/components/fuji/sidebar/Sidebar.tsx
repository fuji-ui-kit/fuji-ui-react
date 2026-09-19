import * as React from "react";
import { cn } from "../../../lib/cn";
import { safeHref as toSafeHref } from "../lib/safe-href";
import { NATIVE_LINK_RESET } from "../lib/native-control-reset";

export const SidebarRoot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function SidebarRoot({ className, children, ...props }, ref) {
    return (
      // `<nav>`, not `<aside>`: items are links, so screen-reader users listing navigation
      // landmarks must find it here, not filed under "complementary" content.
      <nav
        ref={ref}
        // Named for the same reason Navbar is: a page usually has more than
        // one navigation landmark.
        aria-label="Sidebar"
        className={cn(
          "fuji-scrollbar fuji-glass-surface-subtle fj:box-border fj:flex fj:h-full fj:w-64 fj:shrink-0 fj:flex-col fj:gap-4 fj:overflow-y-auto fj:border-r fj:border-fuji-border fj:bg-fuji-surface-subtle fj:p-4",
          className,
        )}
        {...props}
      >
        {children}
      </nav>
    );
  },
);

export const SidebarSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { label?: React.ReactNode }
>(function SidebarSection({ label, className, children, ...props }, ref) {
  const labelId = React.useId();
  return (
    <div
      ref={ref}
      // The label was a visually-adjacent `<p>` and nothing more: "Settings"
      // sat above four links with no structural relationship to them, so the
      // links announced with no indication of which group they belonged to.
      // `role="group"` plus `aria-labelledby` is that relationship.
      role={label ? "group" : undefined}
      aria-labelledby={label ? labelId : undefined}
      className={cn("fj:flex fj:flex-col fj:gap-0.5", className)}
      {...props}
    >
      {label && (
        <p
          id={labelId}
          className="fj:m-0 fj:px-2 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle fj:uppercase fj:tracking-wide"
        >
          {label}
        </p>
      )}
      {children}
    </div>
  );
});

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Glyph before the label. */
  icon?: React.ReactNode;
  /** Marks the current page; sets `aria-current="page"` as well as the active styling. */
  active?: boolean;
  /** The element to render instead of an anchor - a router `Link`, typically. */
  as?: React.ElementType;
}

export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(function SidebarItem(
  { icon, active, as: Tag = "a", className, children, href, ...props },
  ref,
) {
  // Like Navbar/Breadcrumb/Link, sanitize `href` so a CMS-supplied `javascript:` URL can't become
  // a live script link. Only for a real anchor; `as={Link}` hands href to a router.
  const resolvedHref = Tag === "a" ? toSafeHref(href) : href;

  return (
    <Tag
      ref={ref}
      href={resolvedHref}
      aria-current={active ? "page" : undefined}
      className={cn(
        NATIVE_LINK_RESET,
        "fj:flex fj:cursor-pointer fj:items-center fj:gap-2.5 fj:rounded-fuji-control fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        active
          ? "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground"
          : "fj:text-fuji-foreground-muted fuji-hover-raised fj:hover:text-fuji-foreground",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="fj:flex fj:size-4 fj:shrink-0 fj:items-center fj:justify-center">{icon}</span>
      )}
      {children}
    </Tag>
  );
});

/** `<Sidebar><Sidebar.Section label="Main"><Sidebar.Item icon active>Home</Sidebar.Item></Sidebar.Section></Sidebar>` */
export const Sidebar = Object.assign(SidebarRoot, { Section: SidebarSection, Item: SidebarItem });
