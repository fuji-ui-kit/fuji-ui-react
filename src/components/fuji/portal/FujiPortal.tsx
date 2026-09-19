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
 * Portals `children` to `document.body`/`container`, re-stamping theme attrs so CSS variables
 * resolve. Must emit every axis `usePortalThemeAttrs` does (no `data-fuji-material` = solid glass).
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
