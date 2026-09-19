import * as React from "react";
import { cn } from "../../../lib/cn";
import { safeHref } from "../lib/safe-href";

export type LinkTone = "default" | "blue";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Underline behavior. Default "always". */
  underline?: "always" | "hover" | "none";
  /** Color tone. "blue" uses a restrained, accessible link blue. Default "default". */
  tone?: LinkTone;
  /** Deprecated: shorthand for a muted, hover-underlined link. */
  muted?: boolean;
  /** Color tone applied on hover. Accepts the same tones as `tone`. */
  hoverTone?: LinkTone;
}

const UNDERLINE_CLASSES: Record<NonNullable<LinkProps["underline"]>, string> = {
  always: "fj:underline fj:decoration-fuji-border-strong fj:hover:decoration-current",
  hover: "fj:no-underline fj:hover:underline",
  none: "fj:no-underline",
};

const TONE_CLASSES: Record<LinkTone, string> = {
  default: "fj:text-fuji-foreground",
  blue: "fj:text-fuji-water",
};

const HOVER_TONE_CLASSES: Record<LinkTone, string> = {
  default: "fj:hover:text-fuji-foreground",
  blue: "fj:hover:text-fuji-water",
};

/**
 * Plain `<a>` by design - Fuji has no routing dependency; wrap it with Next's `<Link>` by
 * composition. Configures underline and tone; `muted` remains as a shorthand for older call sites.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { underline = "always", tone = "default", muted = false, hoverTone, className, children, href, ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      // Unsafe schemes are dropped (see safe-href.ts); relative paths, hashes and queries always pass.
      href={safeHref(href)}
      className={cn(
        "fj:cursor-pointer fj:underline-offset-4 fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        muted
          ? "fj:text-fuji-foreground-muted fj:no-underline fj:hover:text-fuji-foreground fj:hover:underline"
          : cn(TONE_CLASSES[tone], hoverTone && HOVER_TONE_CLASSES[hoverTone], UNDERLINE_CLASSES[underline]),
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
});
