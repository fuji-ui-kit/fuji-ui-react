"use client";

import { useFujiConfig } from "../../../provider/FujiProvider";

/**
 * Base UI overlays portal to `document.body`, bypassing `FujiPortal`; spread this on each one's
 * outermost styled node so theme/radius variables resolve outside the provider's subtree.
 */
export function usePortalThemeAttrs() {
  const { theme, material, radius, elevation } = useFujiConfig();
  return {
    "data-fuji-theme": theme,
    "data-fuji-material": material,
    "data-fuji-radius": radius,
    "data-fuji-elevation": elevation,
  } as const;
}
