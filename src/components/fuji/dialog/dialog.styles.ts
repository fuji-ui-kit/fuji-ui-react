import type { OverlayMobileBehavior } from "../../../types";

/**
 * Mobile presentation, driven purely by CSS media queries (no JS viewport
 * checks) - the `max-sm:` variants only apply under 640px.
 */
export const MOBILE_BEHAVIOR_CLASSES: Record<OverlayMobileBehavior, string> = {
  dialog:
    "fj:top-1/2 fj:left-1/2 fj:max-h-[85vh] fj:w-[calc(100vw-2rem)] fj:max-w-md fj:-translate-x-1/2 fj:-translate-y-1/2 fj:rounded-fuji-overlay",
  sheet:
    "fj:top-auto fj:bottom-0 fj:left-1/2 fj:max-h-[85vh] fj:w-full fj:max-w-md fj:-translate-x-1/2 fj:translate-y-0 fj:rounded-fuji-overlay " +
    "fj:max-sm:bottom-0 fj:max-sm:left-0 fj:max-sm:w-full fj:max-sm:max-w-none fj:max-sm:translate-x-0 fj:max-sm:rounded-b-none fj:max-sm:pb-[env(safe-area-inset-bottom)] " +
    "fj:sm:top-1/2 fj:sm:-translate-y-1/2",
  fullscreen:
    "fj:top-1/2 fj:left-1/2 fj:max-h-[85vh] fj:w-[calc(100vw-2rem)] fj:max-w-md fj:-translate-x-1/2 fj:-translate-y-1/2 fj:rounded-fuji-overlay " +
    "fj:max-sm:inset-0 fj:max-sm:top-0 fj:max-sm:left-0 fj:max-sm:h-full fj:max-sm:max-h-none fj:max-sm:w-full fj:max-sm:translate-x-0 fj:max-sm:translate-y-0 fj:max-sm:rounded-none fj:max-sm:pt-[env(safe-area-inset-top)] fj:max-sm:pb-[env(safe-area-inset-bottom)]",
};
