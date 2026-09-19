import type { ComponentAppearance, ComponentTone, StatusTone } from "../../../types";

/**
 * Shared tone × appearance → class recipes for every tone-colored component, so one tone identity
 * holds everywhere. Full class strings: Tailwind's static scanner never generates `bg-fuji-${tone}`.
 */
const RECIPES: Record<ComponentTone, Record<ComponentAppearance, string>> = {
  default: {
    contained:
      "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-fuji-border-strong",
    dashed:
      "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-dashed fj:border-fuji-border-strong",
    // Ghost: `shadow-none` overrides the base `shadow-fuji-control` (a shadowed transparent control
    // is a faint box). Hover avoids `-strong`, translucent WHITE under dark glass (2.26:1 over bright
    // pixels, below the 3:1 floor), for `-raised`, which tints dark (measured with `-subtle`: 6.00:1+).
    ghost:
      "fj:shadow-none fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-transparent fj:hover:bg-fuji-surface-raised",
  },
  forest: {
    contained:
      "fuji-raised fj:bg-fuji-contained-forest fj:text-fuji-forest-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-forest fj:border fj:border-fuji-forest-border",
    dashed: "fj:bg-transparent fj:text-fuji-forest fj:border fj:border-dashed fj:border-fuji-forest-border",
    ghost:
      "fj:shadow-none fj:bg-transparent fj:text-fuji-forest fj:border fj:border-transparent fj:hover:bg-fuji-forest-soft",
  },
  sun: {
    contained:
      "fuji-raised fj:bg-fuji-contained-sun fj:text-fuji-sun-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-sun fj:border fj:border-fuji-sun-border",
    dashed: "fj:bg-transparent fj:text-fuji-sun fj:border fj:border-dashed fj:border-fuji-sun-border",
    ghost:
      "fj:shadow-none fj:bg-transparent fj:text-fuji-sun fj:border fj:border-transparent fj:hover:bg-fuji-sun-soft",
  },
  fire: {
    contained:
      "fuji-raised fj:bg-fuji-contained-fire fj:text-fuji-fire-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-fire fj:border fj:border-fuji-fire-border",
    dashed: "fj:bg-transparent fj:text-fuji-fire fj:border fj:border-dashed fj:border-fuji-fire-border",
    ghost:
      "fj:shadow-none fj:bg-transparent fj:text-fuji-fire fj:border fj:border-transparent fj:hover:bg-fuji-fire-soft",
  },
  water: {
    contained:
      "fuji-raised fj:bg-fuji-contained-water fj:text-fuji-water-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-water fj:border fj:border-fuji-water-border",
    dashed: "fj:bg-transparent fj:text-fuji-water fj:border fj:border-dashed fj:border-fuji-water-border",
    ghost:
      "fj:shadow-none fj:bg-transparent fj:text-fuji-water fj:border fj:border-transparent fj:hover:bg-fuji-water-soft",
  },
};

export function appearanceClasses(tone: ComponentTone, appearance: ComponentAppearance): string {
  return RECIPES[tone][appearance];
}

/** Soft background used for badges/alerts that always render "on-tint". */
const SOFT_RECIPES: Record<ComponentTone, string> = {
  // `-raised`, not `-strong`: dark glass's `-strong` is translucent WHITE (for bare tracks), which
  // washed chips out over bright backdrops (2.26:1 Badge, 2.36 Avatar, 2.92 MultiSelect). `-raised` is
  // dark-tinted there and identical elsewhere, so light glass keeps 68% white (an interim `-subtle`
  // dropped it to 34% and 2.45:1).
  default: "fj:bg-fuji-surface-raised fj:text-fuji-foreground",
  forest: "fj:bg-fuji-forest-soft fj:text-fuji-forest",
  sun: "fj:bg-fuji-sun-soft fj:text-fuji-sun",
  fire: "fj:bg-fuji-fire-soft fj:text-fuji-fire",
  water: "fj:bg-fuji-water-soft fj:text-fuji-water",
};

export function softClasses(tone: ComponentTone): string {
  return SOFT_RECIPES[tone];
}

/**
 * Maps a semantic `StatusTone` (Alert, Toast, Progress, ... - its values carry meaning, so they
 * never change) to the rendering `ComponentTone`, so status components share the same recipes.
 */
export const STATUS_TONE_MAP: Record<StatusTone, ComponentTone> = {
  default: "default",
  success: "forest",
  warning: "sun",
  danger: "fire",
  info: "water",
};
