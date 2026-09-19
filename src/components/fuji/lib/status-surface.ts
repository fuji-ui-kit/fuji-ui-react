import type { StatusTone } from "../../../types";

/*
 * Shared status styling so `Alert` and `Toast` variants match. A leading-edge wash, not a full tint
 * (too pale to tell apart), fades before the text. Full class strings - Tailwind's scanner is static.
 */
export const STATUS_WASH: Record<StatusTone, string> = {
  default: "fj:from-fuji-surface-strong",
  success: "fj:from-fuji-forest-soft",
  warning: "fj:from-fuji-sun-soft",
  danger: "fj:from-fuji-fire-soft",
  info: "fj:from-fuji-water-soft",
};

export const STATUS_ICON_TONE: Record<StatusTone, string> = {
  default: "fj:text-fuji-foreground-muted",
  success: "fj:text-fuji-forest",
  warning: "fj:text-fuji-sun",
  danger: "fj:text-fuji-fire",
  info: "fj:text-fuji-water",
};

/**
 * The decorative wash. Absolutely positioned behind the content and stopped
 * well short of the text, so the description never loses contrast against it.
 */
export const STATUS_WASH_CLASS =
  "fj:pointer-events-none fj:absolute fj:inset-y-0 fj:left-0 fj:w-1/2 fj:bg-gradient-to-r fj:to-transparent";

/**
 * The icon's own raised tile. This is what separates the glyph from the wash
 * behind it, rather than relying on the wash for contrast.
 */
export const STATUS_ICON_TILE_CLASS =
  "fj:relative fj:flex fj:size-9 fj:shrink-0 fj:items-center fj:justify-center fj:rounded-fuji-control fj:bg-fuji-surface fj:shadow-fuji-control";
