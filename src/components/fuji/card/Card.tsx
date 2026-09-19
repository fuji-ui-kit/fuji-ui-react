import * as React from "react";
import { cn } from "../../../lib/cn";
import { CardTilt } from "./CardTilt";

/** Hover treatments a Card can opt into. */
export type CardEffect = "none" | "lift" | "tilt";

/** Inner padding of a Card. */
export type CardPadding = "none" | "sm" | "md" | "lg";

/**
 * Padding lives in `--fuji-card-padding`, not `p-*`, so `Card.Media`'s negative margins cancel exactly
 * it. Full class strings, never templated - Tailwind's scanner is static. md 1.25rem = `p-5`.
 */
const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "fj:[--fuji-card-padding:0px]",
  sm: "fj:[--fuji-card-padding:0.75rem]",
  md: "fj:[--fuji-card-padding:1.25rem]",
  lg: "fj:[--fuji-card-padding:1.5rem]",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Hover treatment. Defaults to `"none"`. `"lift"`: scale, tip and shadow in pure CSS (server-safe).
   * `"tilt"`: 3D lean to the pointer (max 3deg), client-only (`CardTilt`), off for touch/reduce.
   */
  effect?: CardEffect;
  /**
   * Legacy hover switch, equivalent to `effect="lift"`.
   * @deprecated Use `effect`, which wins when both are set (so `effect="none"` opts back out).
   */
  interactive?: boolean;
  /**
   * Inner padding. Default `"md"` (20px); `"none"` for flush content. Unlike `className="p-0"` it works
   * regardless of cascade-layer order (docs/theming.md), and `Card.Media` still bleeds to the edge.
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
        // `box-border`: without preflight, a consumer width like `w-80` would exclude border+padding.
        "fj:box-border fuji-glass-surface fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-[var(--fuji-card-padding)] fj:shadow-fuji-card",
        PADDING_CLASSES[padding],
        // Tailwind v4 emits `scale`/`rotate` as their own properties, not `transform`; without them
        // listed the shadow eased while the card snapped.
        "fj:transition-[background-color,border-color,box-shadow,transform,scale,rotate] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        resolved === "lift" && [
          "fj:relative fj:z-0 fj:cursor-pointer fj:transform-gpu fj:duration-[300ms] fj:hover:z-10 fj:hover:border-fuji-border-strong fj:hover:shadow-fuji-panel",
          // Gated by `motion-safe`, not undone by `motion-reduce`: `motion-reduce:scale-100` loses
          // on specificity to `.fj\:hover\:scale-105:hover`, so reduced-motion users still moved.
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
   * Edge(s) the media bleeds to: "top"/"bottom" cancel padding on three sides; "full" on all four,
   * rounding every corner, for an all-media card. Default "top".
   */
  position?: "top" | "bottom" | "full";
}

/**
 * Full-bleed media: cancels the card's padding (`--fuji-card-padding`) on its edge(s) and clips to the
 * card's radius. `position: relative` so `Card.Overlay` or a badge pins to the media, not the card.
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
        // The fallback keeps a 20px bleed outside a Card, where no variable is set.
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
 * Gradient scrim + content pinned to the bottom of a `Card.Media` - a caption baked into a photo.
 * Text is fixed white regardless of theme, since it always sits on a photo.
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
