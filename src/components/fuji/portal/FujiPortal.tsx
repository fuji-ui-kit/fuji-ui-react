"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useFujiConfig } from "../../../provider/FujiProvider";

function subscribeNever() {
  return () => {};
}

export interface FujiPortalProps {
  /** What to render into the portal container. */
  children: React.ReactNode;
  /** Defaults to `document.body`. */
  container?: HTMLElement | null;
}

/**
 * Renders `children` into `document.body` (or `container`) while re-stamping
 * the active theme/material/radius/elevation on a wrapper node, so CSS
 * variables resolve correctly for content that lives outside the provider's
 * DOM subtree. Must emit every axis `usePortalThemeAttrs` does (the parallel
 * mechanism for Base UI's own portals) - omitting `data-fuji-material` would
 * render a portal as solid inside a glass app.
 */
export function FujiPortal({ children, container }: FujiPortalProps) {
  const { theme, material, radius, elevation } = useFujiConfig();
  const mounted = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  const target = container ?? document.body;

  return createPortal(
    <div
      data-fuji-theme={theme}
      data-fuji-material={material}
      data-fuji-radius={radius}
      data-fuji-elevation={elevation}
      className="fuji-portal-root"
    >
      {children}
    </div>,
    target,
  );
}
