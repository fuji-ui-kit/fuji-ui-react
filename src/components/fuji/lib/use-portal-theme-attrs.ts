"use client";

import { useFujiConfig } from "../../../provider/FujiProvider";

/**
 * Base UI's own overlay primitives (Select, Combobox, Menu, Dialog, Popover,
 * Tooltip, Drawer, Toast, NavigationMenu...) manage their own portal to
 * `document.body`, bypassing `FujiPortal`. Spread this onto each
 * primitive's outermost styled node (Popup/Positioner/Content) so theme and
 * radius CSS variables still resolve outside the provider's DOM subtree.
 */
export function usePortalThemeAttrs() {
  const { theme, radius, elevation } = useFujiConfig();
  return { "data-fuji-theme": theme, "data-fuji-radius": radius, "data-fuji-elevation": elevation } as const;
}
