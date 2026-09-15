import type { ComponentAppearance, ComponentTone, StatusTone } from "../../../types";

/**
 * Shared tone × appearance → Tailwind class recipe used by every
 * interactive/tone-colored component (Button, IconButton, Badge, ...).
 * Centralized so the same default/fire/water/forest/sun identity
 * holds everywhere instead of being re-derived per component.
 *
 * Class names are written out in full (not templated) so Tailwind's static
 * scanner can find them - `bg-fuji-${tone}` would never be generated.
 */
// `ghost` carries `shadow-none` explicitly: Button/IconButton's shared base
// applies `shadow-fuji-control` to every appearance, and a transparent
// control that still casts a shadow renders as a faint box - the opposite of
// what "ghost" means. tailwind-merge keeps the later `shadow-none`.
const RECIPES: Record<ComponentTone, Record<ComponentAppearance, string>> = {
  default: {
    contained:
      "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground fj:border fj:border-transparent",
    bordered: "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-fuji-border-strong",
    dashed:
      "fj:bg-transparent fj:text-fuji-foreground fj:border fj:border-dashed fj:border-fuji-border-strong",
    // Hover uses `-subtle`, not `-strong`, for the same reason Badge's default
    // soft chip does: `--fuji-surface-strong` is a translucent WHITE fill under
    // dark glass (white so bare, textless tracks stay visible against a
    // near-black page), and white lightens toward whatever is behind it - so
    // the hovered label measured 2.26:1 over the atmosphere's bright pixels,
    // failing even the 3:1 non-text floor. The other four tones already hover
    // on their OWN low-alpha tint (`-soft`); `default` had no such token and
    // borrowed a bare-fill surface. `-subtle` tints dark here, giving 6.00:1
    // bright / 13.86:1 dark / 17.04:1 on a flat page. Ghost rests transparent,
    // so any fill still reads clearly as hover feedback.
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
  // `-raised`, not `-strong`. Under dark glass `-strong` is a translucent WHITE
  // fill - white on purpose, so bare textless tracks (Switch/Slider/Progress)
  // stay visible against a near-black page. White lightens toward whatever is
  // behind it, so this chip washed out over a bright backdrop and took its ink
  // with it: 2.26:1 on Badge, 2.36 on Avatar's fallback, 2.92 on MultiSelect's
  // value chips (they differ because MultiSelect sits on an extra
  // `fieldSurface()` layer). `-raised` is the content-bearing twin: dark-tinted
  // under dark glass, and byte-identical to `-strong` in every other block - so
  // light glass keeps its 68% white and does NOT get more transparent. An
  // interim version of this fix used `-subtle` and did exactly that, dropping
  // light-glass chips to 34% white and 2.45:1 over an uncontrolled photo.
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
