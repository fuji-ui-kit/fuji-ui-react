import * as React from "react";
import { cn } from "../../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Opts into a clickable-card treatment with a small scale and tilt on hover. */
  interactive?: boolean;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(function CardRoot(
  { interactive = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        // A consumer-supplied fixed/percentage width (very common on Card -
        // e.g. `className="w-80"`) combines with this border+padding; without
        // preflight's universal box-sizing:border-box, that width would be
        // exceeded by the border+padding instead of including them.
        "fj:box-border fuji-glass-surface fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-5 fj:shadow-fuji-card",
        "fj:transition-[background-color,border-color,box-shadow,transform] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        interactive && [
          "fj:relative fj:z-0 fj:cursor-pointer fj:transform-gpu fj:duration-[300ms] fj:hover:z-10 fj:hover:scale-105 fj:hover:-rotate-1 fj:hover:border-fuji-border-strong fj:hover:shadow-fuji-panel",
          "fj:active:z-0 fj:active:scale-[1.02] fj:active:rotate-0 fj:active:shadow-fuji-card",
          "fj:motion-reduce:transform-none fj:motion-reduce:transition-none",
        ],
        className,
      )}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn("fj:mb-4 fj:flex fj:flex-col fj:gap-1", className)} {...props} />;
});

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
 * Full-bleed media area - cancels `CardRoot`'s own padding on the relevant
 * edge and clips its content to match the card's own corner radius, so an
 * `<Image>` (or any media) reaches the card's outer edge instead of sitting
 * inset inside the padded body. `position: relative` so `Card.Overlay` (or
 * any absolutely-positioned child - a badge, an avatar) can pin itself
 * against the media instead of the whole card.
 */
const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia(
  { position = "top", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "fj:relative fj:overflow-hidden",
        position === "full" && "fj:-m-5 fj:rounded-fuji-panel",
        position === "top" && "fj:-mx-5 fj:-mt-5 fj:mb-4 fj:rounded-t-fuji-panel",
        position === "bottom" && "fj:-mx-5 fj:-mb-5 fj:mt-4 fj:rounded-b-fuji-panel",
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
const CardOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
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

const CardTitle = React.forwardRef<HTMLElement, CardTitleProps>(function CardTitle(
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

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
        {...props}
      />
    );
  },
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fj:text-fuji-foreground", className)} {...props} />;
  },
);

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardFooter(
  { className, ...props },
  ref,
) {
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
});

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
