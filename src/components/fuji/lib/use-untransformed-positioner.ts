"use client";

import * as React from "react";

/**
 * Rewrites a Base UI positioner's `transform: translate(x, y)` into plain
 * `left`/`top`, keeping the element visually where it was.
 *
 * Why this exists: an element with a `backdrop-filter` cannot sample the page
 * behind it when an ancestor carries a `transform` - Chrome treats that
 * ancestor as a backdrop root, so the filter has nothing to read and the panel
 * renders as its flat tint with no blur. Base UI positions every portaled popup
 * with `transform: translate(...)` plus `will-change: transform`, so under
 * glass the entire portaled layer (Dialog, Drawer, Select, Popover, menus)
 * lost its material in Chrome while non-portaled surfaces kept theirs.
 * Verified in-browser: the positioner is the only structural difference
 * between a popup that blurs and one that does not.
 *
 * Base UI 1.7 exposes no option to position without a transform (its positioner
 * props are open/side/align/anchorHidden/instant), hence doing it here.
 *
 * The observer re-flattens on every reposition (scroll, resize, flip). Writing
 * the style re-triggers the observer, but the second pass sees `transform:
 * none` and returns immediately, so it settles rather than looping.
 */
export function useUntransformedPositioner<T extends HTMLElement>(): React.RefCallback<T> {
  const cleanup = React.useRef<(() => void) | null>(null);

  return React.useCallback((node: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node) return;

    // Floating-ui writes `transform: translate(x, y)` where x/y are absolute
    // offsets from the positioner's ORIGINAL left/top (it sets 0,0 and never
    // reads them back). So every fold must resolve against that original
    // base, captured once - folding against the CURRENT left/top compounds
    // the previous fold, and on the second reposition (a resize, a late
    // image load re-measuring the anchor) the popup landed at roughly twice
    // its offset. Verified live: one reposition looked fine, two displaced it.
    let base: { left: number; top: number } | null = null;

    const flatten = () => {
      // Read the inline value: an empty/none transform means we have already
      // flattened this position and there is nothing to fold in.
      if (!node.style.transform || node.style.transform === "none") return;
      base ??= {
        left: parseFloat(node.style.left) || 0,
        top: parseFloat(node.style.top) || 0,
      };
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      node.style.transform = "none";
      // `will-change: transform` is a backdrop root in its own right, so it has
      // to go too - keeping it would leave the blur broken even with no
      // transform applied.
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
