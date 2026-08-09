import type { ComponentAppearance, ComponentTone, StatusTone } from "../../../types";

/**
 * Shared tone × appearance → Tailwind class recipe used by every
 * interactive/tone-colored component (Button, IconButton, Badge, ...).
 * Centralized so the same default/earth/fire/water/forest/sun identity
 * holds everywhere instead of being re-derived per component.
 *
 * Class names are written out in full (not templated) so Tailwind's static
 * scanner can find them - `bg-fuji-${tone}` would never be generated.
 */
const RECIPES: Record<ComponentTone, Record<ComponentAppearance, string>> = {
  default: {
    contained: "fj:bg-fuji-contained-default fj:text-fuji-default-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-fuji-border-strong",
    dashed:
      "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-dashed fj:border-fuji-border-strong",
    ghost:
      "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-transparent fj:hover:bg-fuji-surface-strong",
  },
  earth: {
    contained: "fj:bg-fuji-contained-earth fj:text-fuji-earth-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-foreground-muted fj:border fj:border-fuji-border-strong",
    dashed:
      "fj:bg-transparent fj:text-fuji-foreground-muted fj:border fj:border-dashed fj:border-fuji-border-strong",
    ghost:
      "fj:bg-transparent fj:text-fuji-foreground-muted fj:border fj:border-transparent fj:hover:bg-fuji-surface-subtle",
  },
  forest: {
    contained: "fj:bg-fuji-contained-forest fj:text-fuji-forest-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-forest fj:border fj:border-fuji-forest-border",
    dashed: "fj:bg-transparent fj:text-fuji-forest fj:border fj:border-dashed fj:border-fuji-forest-border",
    ghost:
      "fj:bg-transparent fj:text-fuji-forest fj:border fj:border-transparent fj:hover:bg-fuji-forest-soft",
  },
  sun: {
    contained: "fj:bg-fuji-contained-sun fj:text-fuji-sun-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-sun fj:border fj:border-fuji-sun-border",
    dashed: "fj:bg-transparent fj:text-fuji-sun fj:border fj:border-dashed fj:border-fuji-sun-border",
    ghost: "fj:bg-transparent fj:text-fuji-sun fj:border fj:border-transparent fj:hover:bg-fuji-sun-soft",
  },
  fire: {
    contained: "fj:bg-fuji-contained-fire fj:text-fuji-fire-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-fire fj:border fj:border-fuji-fire-border",
    dashed: "fj:bg-transparent fj:text-fuji-fire fj:border fj:border-dashed fj:border-fuji-fire-border",
    ghost: "fj:bg-transparent fj:text-fuji-fire fj:border fj:border-transparent fj:hover:bg-fuji-fire-soft",
  },
  water: {
    contained: "fj:bg-fuji-contained-water fj:text-fuji-water-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-water fj:border fj:border-fuji-water-border",
    dashed: "fj:bg-transparent fj:text-fuji-water fj:border fj:border-dashed fj:border-fuji-water-border",
    ghost: "fj:bg-transparent fj:text-fuji-water fj:border fj:border-transparent fj:hover:bg-fuji-water-soft",
  },
};

export function appearanceClasses(tone: ComponentTone, appearance: ComponentAppearance): string {
  return RECIPES[tone][appearance];
}

/** Soft background used for badges/alerts that always render "on-tint". */
const SOFT_RECIPES: Record<ComponentTone, string> = {
  default: "fj:bg-fuji-surface-strong fj:text-fuji-foreground",
  earth: "fj:bg-fuji-earth fj:text-fuji-earth-foreground",
  forest: "fj:bg-fuji-forest-soft fj:text-fuji-forest",
  sun: "fj:bg-fuji-sun-soft fj:text-fuji-sun",
  fire: "fj:bg-fuji-fire-soft fj:text-fuji-fire",
  water: "fj:bg-fuji-water-soft fj:text-fuji-water",
};

export function softClasses(tone: ComponentTone): string {
  return SOFT_RECIPES[tone];
}

/**
 * Maps a semantic `StatusTone` (Alert/Toast/Result/StatusIndicator/Timeline/
 * Progress/CircularProgress - components where the value itself carries
 * accessibility-relevant meaning, so their prop name and values never
 * change) to the `ComponentTone` that renders it, so status components draw
 * from the exact same recipe as purely decorative ones.
 */
export const STATUS_TONE_MAP: Record<StatusTone, ComponentTone> = {
  default: "default",
  success: "forest",
  warning: "sun",
  danger: "fire",
  info: "water",
};
