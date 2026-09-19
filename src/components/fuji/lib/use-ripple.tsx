"use client";

import * as React from "react";

/**
 * Material ripple for Button/IconButton (host needs `fuji-ripple`): grows from the press, holds, fades
 * on release. WAAPI, not keyframes: grow and fade time independently (fade waits >=150ms).
 */

/** Held wave opacity: below the reference's 0.4 accent tint, as this is `currentColor` over a fill. */
const PEAK_OPACITY = 0.2;
export function useRipple(enabled: boolean) {
  const active = React.useRef<Set<HTMLSpanElement>>(new Set());
  React.useEffect(() => {
    const nodes = active.current;
    return () => nodes.forEach((node) => node.remove());
  }, []);

  return React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      const host = event.currentTarget;
      // jsdom lacks WAAPI; skip the decoration rather than throw in consumers' tests.
      if (typeof host.animate !== "function") return;
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Radius to the furthest corner, so the circle reaches every edge.
      const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

      const node = document.createElement("span");
      node.className = "fuji-ripple-wave";
      node.style.left = `${x - radius}px`;
      node.style.top = `${y - radius}px`;
      node.style.width = node.style.height = `${radius * 2}px`;
      host.appendChild(node);
      active.current.add(node);

      // Opacity ramps with the expansion: starting at full strength reads as a hard-edged disc.
      const grow = node.animate(
        [
          { transform: "scale(0)", opacity: 0 },
          { transform: "scale(1)", opacity: PEAK_OPACITY },
        ],
        { duration: 420, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" },
      );
      const pressedAt = performance.now();

      const release = () => {
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        // Let a tap show at least a short press before the fade begins.
        const wait = Math.max(0, 150 - (performance.now() - pressedAt));
        window.setTimeout(() => {
          // Fade from the on-screen opacity: a literal `1` flashes on a release mid-ramp.
          const from = Number.parseFloat(getComputedStyle(node).opacity) || PEAK_OPACITY;
          node.animate([{ opacity: from }, { opacity: 0 }], {
            duration: 320,
            easing: "linear",
            fill: "forwards",
          });
          // A timer, not `onfinish`: background tabs get no frames to dispatch it, so the wave
          // would linger in the DOM.
          window.setTimeout(() => {
            grow.cancel();
            node.remove();
            active.current.delete(node);
          }, 340);
        }, wait);
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    },
    [enabled],
  );
}
