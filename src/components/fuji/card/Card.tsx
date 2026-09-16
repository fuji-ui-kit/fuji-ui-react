import * as React from "react";
import { cn } from "../../../lib/cn";
import { CardTilt } from "./CardTilt";

/** Hover treatments a Card can opt into. */
export type CardEffect = "none" | "lift" | "tilt";

/** Inner padding of a Card. */
export type CardPadding = "none" | "sm" | "md" | "lg";

/**
 * Padding is carried by `--fuji-card-padding` rather than a `p-*` class so
 * `Card.Media` can cancel exactly the padding its card has (its negative
 * margins read the same variable). Full class strings, never templated -
 * Tailwind's scanner is static. `md` is the original `p-5` (1.25rem on the
 * 0.25rem spacing scale); `sm` is `p-3`, `lg` is `p-6`.
 */
const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "fj:[--fuji-card-padding:0px]",
  sm: "fj:[--fuji-card-padding:0.75rem]",
  md: "fj:[--fuji-card-padding:1.25rem]",
  lg: "fj:[--fuji-card-padding:1.5rem]",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Hover treatment for a clickable card. Defaults to `"none"`.
   *
   * - `"lift"` - scales up slightly, tips a degree and deepens its shadow.
   *   Pure CSS, works in a Server Component.
   * - `"tilt"` - tracks the pointer and tilts in 3D towards it, springing
   *   back on leave. Needs a client boundary (see `CardTilt`), and is skipped
   *   for touch pointers and under `prefers-reduced-motion: reduce`.
   */
  effect?: CardEffect;
  /**
   * @deprecated Use `effect="lift"`. Kept working so 0.2.x code keeps
   * behaving as it did; `effect` wins if both are given.
   */
  /**
   * Legacy hover switch, equivalent to `effect="lift"`.
   *
   * @deprecated Use `effect`. This still works, but `effect` wins when both are
   * set - so `effect="none"` opts a card back out.
   */
  interactive?: boolean;
  /**
   * Inner padding. Default `"md"` (20px, unchanged from before this prop).
   *
   * `"none"` is for flush content - an edge-to-edge image, a table or list
   * with its own row padding. A `className="p-0"` only wins when the app's
   * cascade layers rank Fuji's below its utilities (see
   * `docs/theming.md`), and even then leaves `Card.Media` cancelling 20px
   * that is no longer there; this prop works regardless of stylesheet order,
   * and `Card.Media` follows it, so media still bleeds to the edge at any
   * padding.
   */
  padding?: CardPadding;
}

export const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(function CardRoot(
  { effect, interactive = false, padding = "md", className, ...props },
  ref,
) {
  const resolved: CardEffect = effect ?? (interactive ? "lift" : "none");
  const Root = resolved === "tilt" ? CardTilt : "div";
  return (
    <Root
      ref={ref}
      className={cn(
        // A consumer-supplied fixed/percentage width (very common on Card -
        // e.g. `className="w-80"`) combines with this border+padding; without
        // preflight's universal box-sizing:border-box, that width would be
        // exceeded by the border+padding instead of including them.
        "fj:box-border fuji-glass-surface fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-[var(--fuji-card-padding)] fj:shadow-fuji-card",
        PADDING_CLASSES[padding],
        // `scale` and `rotate` are named explicitly: Tailwind v4 emits those
        // as their own CSS properties, NOT as the `transform` shorthand, so
        // listing `transform` alone left the hover tilt un-transitioned - the
        // shadow eased while the card snapped.
        "fj:transition-[background-color,border-color,box-shadow,transform,scale,rotate] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        resolved === "lift" && [
          "fj:relative fj:z-0 fj:cursor-pointer fj:transform-gpu fj:duration-[300ms] fj:hover:z-10 fj:hover:border-fuji-border-strong fj:hover:shadow-fuji-panel",
          // The moving half is gated behind `motion-safe` rather than undone
          // afterwards by `motion-reduce`. A `motion-reduce:scale-100` loses
          // on specificity every time - `.fj\:hover\:scale-105:hover` carries
          // a pseudo-class and a media query adds none - so the card still
          // scaled and tipped for a reduced-motion visitor. Gating means the
          // rule is never emitted for them at all.
          "fj:motion-safe:hover:scale-105 fj:motion-safe:hover:-rotate-1",
          "fj:active:z-0 fj:active:shadow-fuji-card fj:motion-safe:active:scale-[1.02] fj:motion-safe:active:rotate-0",
          "fj:motion-reduce:transition-none",
        ],
        resolved === "tilt" &&
          "fj:relative fj:z-0 fj:cursor-pointer fj:hover:z-10 fj:hover:shadow-fuji-panel",
        className,
      )}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fj:mb-4 fj:flex fj:flex-col fj:gap-1", className)} {...props} />;
  },
);

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which edge(s) the media bleeds to. "top"/"bottom" cancel padding on
   * three sides, leaving room for further `Card.Header`/`Content`/`Footer`
   * below or above. "full" cancels all four sides and rounds every corner -
   * for a card that's entirely media (e.g. a photo with `Card.Overlay` text
   * baked in, and nothing else). Default "top".
   */
  position?: "top" | "bottom" | "full";
}

/**
 * Full-bleed media area - cancels `CardRoot`'s own padding (whatever its
 * `padding` prop is, through `--fuji-card-padding`) on the relevant
 * edge and clips its content to match the card's own corner radius, so an
 * `<Image>` (or any media) reaches the card's outer edge instead of sitting
 * inset inside the padded body. `position: relative` so `Card.Overlay` (or
 * any absolutely-positioned child - a badge, an avatar) can pin itself
 * against the media instead of the whole card.
 */
export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia(
  { position = "top", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "fj:relative fj:overflow-hidden",
        // The fallback keeps the original 20px bleed for a Card.Media placed
        // outside a Card (or inside a custom surface) that sets no variable.
        position === "full" && "fj:-m-[var(--fuji-card-padding,1.25rem)] fj:rounded-fuji-panel",
        position === "top" &&
          "fj:-mx-[var(--fuji-card-padding,1.25rem)] fj:-mt-[var(--fuji-card-padding,1.25rem)] fj:mb-4 fj:rounded-t-fuji-panel",
        position === "bottom" &&
          "fj:-mx-[var(--fuji-card-padding,1.25rem)] fj:-mb-[var(--fuji-card-padding,1.25rem)] fj:mt-4 fj:rounded-b-fuji-panel",
        className,
      )}
      {...props}
    />
  );
});

/**
 * Gradient scrim + content pinned to the bottom of a `Card.Media` (or any
 * `position: relative` media wrapper) - the "photo with a caption baked into
 * the image" pattern. Text is fixed white regardless of theme, since it
 * always sits on a photo, not a themed surface.
 */
export const CardOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardOverlay({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "fj:absolute fj:inset-x-0 fj:bottom-0 fj:flex fj:flex-col fj:gap-1 fj:bg-gradient-to-t fj:from-black/85 fj:via-black/45 fj:to-transparent fj:p-4 fj:pt-10 fj:text-white",
          className,
        )}
        {...props}
      />
    );
  },
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLElement> {
  /** Override the rendered element (defaults to h3, its semantic role). */
  as?: keyof React.JSX.IntrinsicElements;
}

export const CardTitle = React.forwardRef<HTMLElement, CardTitleProps>(function CardTitle(
  { as, className, ...props },
  ref,
) {
  const Tag = (as ?? "h3") as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cn(
        "fj:m-0 fj:text-[length:var(--fuji-text-md)] fj:font-semibold fj:text-fuji-foreground",
        className,
      )}
      {...props}
    />
  );
});

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fj:text-fuji-foreground", className)} {...props} />;
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "fj:mt-4 fj:flex fj:items-center fj:gap-2 fj:border-t fj:border-fuji-border fj:pt-4",
          className,
        )}
        {...props}
      />
    );
  },
);

/** `<Card><Card.Media><Image/></Card.Media><Card.Header><Card.Title/><Card.Description/></Card.Header><Card.Content/><Card.Footer/></Card>` */
export const Card = Object.assign(CardRoot, {
  Media: CardMedia,
  Overlay: CardOverlay,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});
