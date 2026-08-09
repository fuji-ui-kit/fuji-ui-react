import * as React from "react";
import { cn } from "../../../lib/cn";
import { isSafeHref } from "../lib/safe-href";

export type LinkColor = "default" | "blue";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Underline behavior. Default "always". */
  underline?: "always" | "hover" | "none";
  /** Color tone. "blue" uses a restrained, accessible link blue. Default "default". */
  color?: LinkColor;
  /** Deprecated: shorthand for a muted, hover-underlined link. */
  muted?: boolean;
  /** Color tone applied on hover. Accepts the same tones as `color`. */
  hover?: LinkColor;
}

const UNDERLINE_CLASSES: Record<NonNullable<LinkProps["underline"]>, string> = {
  always: "fj:underline fj:decoration-fuji-border-strong fj:hover:decoration-current",
  hover: "fj:no-underline fj:hover:underline",
  none: "fj:no-underline",
};

const COLOR_CLASSES: Record<LinkColor, string> = {
  default: "fj:text-fuji-foreground",
  blue: "fj:text-fuji-water",
};

const HOVER_COLOR_CLASSES: Record<LinkColor, string> = {
  default: "fj:hover:text-fuji-foreground",
  blue: "fj:hover:text-fuji-water",
};

/**
 * Plain `<a>` by design - Fuji has no routing dependency. Website call sites
 * wrap this with Next's `<Link>` via composition (see `components/website`)
 * rather than this component importing Next. Configure the underline behavior
 * and color tone; `muted` remains as a shorthand for older call sites.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { underline = "always", color = "default", muted = false, hover, className, children, href, ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      // Dropped rather than passed through when unsafe - see safe-href.ts.
      // Only the scheme is validated; relative paths, hashes, and query
      // strings are always allowed, so this is a no-op for every ordinary use.
      href={isSafeHref(href) ? href : undefined}
      className={cn(
        "fj:cursor-pointer fj:underline-offset-4 fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        muted
          ? "fj:text-fuji-foreground-muted fj:no-underline fj:hover:text-fuji-foreground fj:hover:underline"
          : cn(COLOR_CLASSES[color], hover && HOVER_COLOR_CLASSES[hover], UNDERLINE_CLASSES[underline]),
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
});
