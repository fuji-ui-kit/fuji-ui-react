import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/cn";
import { safeHref } from "../lib/safe-href";
import { NATIVE_LINK_RESET } from "../lib/native-control-reset";
import { applyLinkProps, type NavigationLinkProps } from "../lib/link-props";

/** The props Fuji's own anchor receives, passed to `renderLink` as its third argument. */
export type BreadcrumbLinkProps = NavigationLinkProps;

const LINK_CLASSNAME = cn(
  NATIVE_LINK_RESET,
  "fj:rounded-[2px] fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
);

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** The trail, root first. The last entry renders as the current page rather than a link. */
  items: BreadcrumbItem[];
  /**
   * Renders the anchor element for each linked ancestor - pass Next's `Link`
   * to get client-side navigation. (The last entry is the current page and is
   * never a link; it keeps `aria-current="page"` on its own element.)
   *
   * The third argument carries what Fuji's own anchor gets: `href`, the link
   * `className` and `children`, so `(item, children, props) => <Link {...props} />`
   * is a complete link. Returning a single element without spreading them is
   * also fine - they are applied to it for you, filling in only what it does
   * not set itself.
   */
  renderLink?: (
    item: BreadcrumbItem,
    children: React.ReactNode,
    linkProps: BreadcrumbLinkProps,
  ) => React.ReactNode;
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, renderLink, className, ...props },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cn(className)} {...props}>
      <ol className="fj:m-0 fj:flex fj:list-none fj:flex-wrap fj:items-center fj:gap-1 fj:p-0 fj:text-[length:var(--fuji-text-sm)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = (
            <span
              className={
                isLast
                  ? "fj:font-medium fj:text-fuji-foreground"
                  : "fj:cursor-pointer fj:text-fuji-foreground-muted fj:underline-offset-4 fj:hover:text-fuji-foreground fj:hover:underline"
              }
            >
              {item.label}
            </span>
          );
          return (
            <li key={index} className="fj:flex fj:items-center fj:gap-1">
              {index > 0 && (
                <ChevronRight className="fj:size-3.5 fj:text-fuji-foreground-subtle" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined}>{content}</span>
              ) : renderLink ? (
                (() => {
                  const linkProps: BreadcrumbLinkProps = {
                    href: item.href,
                    className: LINK_CLASSNAME,
                    children: content,
                  };
                  return applyLinkProps(renderLink(item, content, linkProps), linkProps);
                })()
              ) : (
                <a href={safeHref(item.href)} className={LINK_CLASSNAME}>
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
