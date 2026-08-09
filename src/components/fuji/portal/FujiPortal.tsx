"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useFujiConfig } from "../../../provider/FujiProvider";

function subscribeNever() {
  return () => {};
}

export interface FujiPortalProps {
  children: React.ReactNode;
  /** Defaults to `document.body`. */
  container?: HTMLElement | null;
}

/**
 * Renders `children` into `document.body` (or `container`) while re-stamping
 * the active theme/radius on a wrapper node, so CSS variables resolve
 * correctly for content that lives outside the provider's DOM subtree.
 */
export function FujiPortal({ children, container }: FujiPortalProps) {
  const { theme, radius, elevation } = useFujiConfig();
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
      data-fuji-radius={radius}
      data-fuji-elevation={elevation}
      className="fuji-portal-root"
    >
      {children}
    </div>,
    target,
  );
}
