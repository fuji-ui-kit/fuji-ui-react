import * as React from "react";
import { cn } from "../../../lib/cn";

/**
 * The props a navigation component's own `<a>` would get, passed to `renderLink` so a router link
 * matches it. Re-exported per component (`NavbarLinkProps`, `BreadcrumbLinkProps`, ...).
 */
export interface NavigationLinkProps {
  /** The item's `href`, unmodified - a router resolves it itself. */
  href: string;
  /** `"page"` on the current item, matching the default anchor. */
  "aria-current"?: "page";
  /** The default anchor's reset, layout and focus-ring classes. */
  className: string;
  /** Present when the component reports selection (e.g. `onItemSelect`). */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** The styled item content - the same node passed as `renderLink`'s second argument. */
  children: React.ReactNode;
}

type LinkElementProps = {
  className?: string;
  "aria-current"?: unknown;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

/**
 * Applies `linkProps` to `renderLink`'s result, filling gaps only (the consumer's `aria-current` and
 * `className` win, their `onClick` runs first). Non-elements and Fragments pass through untouched.
 */
export function applyLinkProps(node: React.ReactNode, linkProps: NavigationLinkProps): React.ReactNode {
  if (!React.isValidElement<LinkElementProps>(node) || node.type === React.Fragment) return node;
  const own = node.props;
  const onClick =
    linkProps.onClick && own.onClick !== linkProps.onClick
      ? (event: React.MouseEvent<HTMLElement>) => {
          own.onClick?.(event);
          linkProps.onClick?.(event);
        }
      : own.onClick;
  return React.cloneElement(node, {
    "aria-current": own["aria-current"] ?? linkProps["aria-current"],
    className: cn(linkProps.className, own.className),
    onClick,
  });
}
