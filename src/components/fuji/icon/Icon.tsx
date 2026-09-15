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
  /** Glyph size, and the container size when `background` is set. */
  size?: ComponentSize;
  /** Glyph color, resolved through Fuji tokens. */
  tone?: IconTone;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech with
   * this name; when omitted the icon is decorative and hidden from it.
   */
  label?: string;
  /** Optional background container behind the glyph. */
  background?: "none" | "subtle" | "solid";
  /** Extra classes merged onto the glyph, or onto its container when `background` is set. */
  className?: string;
}

const GLYPH_SIZE: Record<ComponentSize, string> = { sm: "fj:size-4", md: "fj:size-5", lg: "fj:size-6" };
const BOX_SIZE: Record<ComponentSize, string> = { sm: "fj:size-7", md: "fj:size-9", lg: "fj:size-11" };

const TONE_TEXT: Record<IconTone, string> = {
  default: "fj:text-current",
  muted: "fj:text-fuji-foreground-muted",
  subtle: "fj:text-fuji-foreground-subtle",
  forest: "fj:text-fuji-forest",
  sun: "fj:text-fuji-sun",
  fire: "fj:text-fuji-fire",
  water: "fj:text-fuji-water",
};

// Soft, on-tint container background for `background="subtle"`.
const TONE_SUBTLE_BG: Record<IconTone, string> = {
  default: "fj:bg-fuji-surface-raised",
  muted: "fj:bg-fuji-surface-raised",
  subtle: "fj:bg-fuji-surface-raised",
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
        background === "solid" ? TONE_SOLID[tone] : cn(TONE_SUBTLE_BG[tone], TONE_TEXT[tone]),
        className,
      )}
    >
      {React.cloneElement(glyph, { "aria-hidden": true })}
    </span>
  );
}
