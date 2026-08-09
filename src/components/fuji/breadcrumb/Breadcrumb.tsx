import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/cn";
import { isSafeHref } from "../lib/safe-href";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Renders the anchor element - pass Next's `Link` to get client-side navigation. */
  renderLink?: (item: BreadcrumbItem, children: React.ReactNode) => React.ReactNode;
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
                renderLink(item, content)
              ) : (
                <a
                  href={isSafeHref(item.href) ? item.href : undefined}
                  className="fj:rounded-[2px] fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring"
                >
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
