import * as React from "react";
import { cn } from "../../../lib/cn";

/**
 * What a navigation component's own `<a>` would have received, handed to a
 * consumer's `renderLink` so a router link can carry the same semantics and
 * styling. Internal: each component re-exports it under its own name
 * (`NavbarLinkProps`, `BreadcrumbLinkProps`, `BottomNavigationLinkProps`).
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
 * Applies `linkProps` to whatever `renderLink` returned, so a consumer who
 * writes the common `(item, children) => <Link href={item.href}>{children}</Link>`
 * - ignoring the third argument - still gets `aria-current`, the link reset
 * and focus ring, and the selection callback, exactly like the default anchor.
 *
 * Only fills gaps: a consumer's own `aria-current` wins, their `className` is
 * merged after ours (so it wins conflicts), and their `onClick` runs first.
 * Anything that is not a single element (a string, an array, a Fragment,
 * which accepts no props) is returned untouched.
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
