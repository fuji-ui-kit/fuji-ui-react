"use client";

import * as React from "react";

/**
 * Turns a Base UI positioner's `translate()` into `left`/`top`: a transformed ancestor is a Chrome
 * backdrop root, killing glass popup blur. Its own write re-triggers the observer, which then no-ops.
 */
export function useUntransformedPositioner<T extends HTMLElement>(): React.RefCallback<T> {
  const cleanup = React.useRef<(() => void) | null>(null);

  return React.useCallback((node: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node) return;

    // Floating-ui's translate is relative to the ORIGINAL left/top, so fold against a base captured
    // once; folding against the current values doubled the offset on the second reposition.
    let base: { left: number; top: number } | null = null;

    const flatten = () => {
      // An empty/none inline transform means this position is already flattened.
      if (!node.style.transform || node.style.transform === "none") return;
      base ??= {
        left: parseFloat(node.style.left) || 0,
        top: parseFloat(node.style.top) || 0,
      };
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      node.style.transform = "none";
      // `will-change: transform` is a backdrop root too, so it goes as well.
      node.style.willChange = "auto";
      node.style.left = `${base.left + matrix.m41}px`;
      node.style.top = `${base.top + matrix.m42}px`;
    };

    flatten();
    const observer = new MutationObserver(flatten);
    observer.observe(node, { attributes: true, attributeFilter: ["style"] });
    cleanup.current = () => observer.disconnect();
  }, []);
}
