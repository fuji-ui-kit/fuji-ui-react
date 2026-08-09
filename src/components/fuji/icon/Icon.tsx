import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize, ComponentTone } from "../../../types";

export type IconTone = "default" | "muted" | "subtle" | ComponentTone;

/**
 * Any SVG icon component that accepts standard SVG props (className above
 * all) - every Lucide icon satisfies this already, since `LucideProps`
 * extends `React.SVGProps<SVGSVGElement>` and adds only optional fields. Not
 * pinned to `LucideIcon` specifically so a compatible icon from another set,
 * or a hand-written SVG component, works here too.
 */
export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface IconProps {
  /** An individually imported icon component, e.g. `icon={Check}` from lucide-react, or any compatible SVG component. */
  icon: IconComponent;
  size?: ComponentSize;
  tone?: IconTone;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech with
   * this name; when omitted the icon is decorative and hidden from it.
   */
  label?: string;
  /** Optional background container behind the glyph. */
  background?: "none" | "subtle" | "solid";
  className?: string;
}

const GLYPH_SIZE: Record<ComponentSize, string> = { sm: "fj:size-4", md: "fj:size-5", lg: "fj:size-6" };
const BOX_SIZE: Record<ComponentSize, string> = { sm: "fj:size-7", md: "fj:size-9", lg: "fj:size-11" };

const TONE_TEXT: Record<IconTone, string> = {
  default: "fj:text-current",
  muted: "fj:text-fuji-foreground-muted",
  subtle: "fj:text-fuji-foreground-subtle",
  earth: "fj:text-fuji-earth",
  forest: "fj:text-fuji-forest",
  sun: "fj:text-fuji-sun",
  fire: "fj:text-fuji-fire",
  water: "fj:text-fuji-water",
};

// Soft, on-tint container background for `background="subtle"`. "earth" has
// no separate soft/tinted variant (unlike forest/sun/fire/water), so it uses
// its own full fill + matching foreground here too - see the `earth`
// special case where this is consumed below.
const TONE_SUBTLE_BG: Record<IconTone, string> = {
  default: "fj:bg-fuji-surface-strong",
  muted: "fj:bg-fuji-surface-strong",
  subtle: "fj:bg-fuji-surface-strong",
  earth: "fj:bg-fuji-earth fj:text-fuji-earth-foreground",
  forest: "fj:bg-fuji-forest-soft",
  sun: "fj:bg-fuji-sun-soft",
  fire: "fj:bg-fuji-fire-soft",
  water: "fj:bg-fuji-water-soft",
};

// Solid container background for `background="solid"` (icon flips to the tint's foreground).
const TONE_SOLID: Record<IconTone, string> = {
  default: "fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
  muted: "fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
  subtle: "fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
  earth: "fj:bg-fuji-contained-earth fj:text-fuji-earth-foreground",
  forest: "fj:bg-fuji-contained-forest fj:text-fuji-forest-foreground",
  sun: "fj:bg-fuji-contained-sun fj:text-fuji-sun-foreground",
  fire: "fj:bg-fuji-contained-fire fj:text-fuji-fire-foreground",
  water: "fj:bg-fuji-contained-water fj:text-fuji-water-foreground",
};

/**
 * One reusable icon primitive. Accepts an individually imported Lucide icon
 * component (never a string name, never a dynamic import of the whole set),
 * applies a semantic tone and size, marks the glyph decorative or labeled for
 * assistive tech, and optionally wraps it in a subtle or solid background.
 */
export function Icon({
  icon: Glyph,
  size = "md",
  tone = "default",
  label,
  background = "none",
  className,
}: IconProps) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true };
  const glyph = <Glyph className={cn(GLYPH_SIZE[size], background === "none" && TONE_TEXT[tone])} />;

  if (background === "none") {
    return React.cloneElement(glyph, { ...a11y, className: cn(glyph.props.className, className) });
  }

  return (
    <span
      {...a11y}
      className={cn(
        "fj:inline-flex fj:shrink-0 fj:items-center fj:justify-center fj:rounded-fuji-control fj:shadow-fuji-control",
        BOX_SIZE[size],
        background === "solid"
          ? TONE_SOLID[tone]
          : // "earth"'s subtle background already carries its own paired text
            // color (see TONE_SUBTLE_BG's comment) - applying TONE_TEXT.earth
            // ("text-fuji-earth", the same color as this background) on top
            // would make the icon disappear into it.
            cn(TONE_SUBTLE_BG[tone], tone !== "earth" && TONE_TEXT[tone]),
        className,
      )}
    >
      {React.cloneElement(glyph, { "aria-hidden": true })}
    </span>
  );
}
