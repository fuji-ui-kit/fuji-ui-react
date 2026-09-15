"use client";

import * as React from "react";

/**
 * Material-style ripple (the reference is motion.dev's "material design
 * ripple"): a circle grows from the press point and STAYS while the pointer
 * is held, then fades out on release. Each press gets its own node, so a
 * quick double-tap shows two circles rather than restarting one.
 *
 * Built on the Web Animations API rather than a CSS keyframe because the two
 * halves have independent timing - the expansion starts on pointerdown, the
 * fade starts on pointerup, and the fade must not begin before the expansion
 * has had at least ~150ms to read as a press, however fast the release was.
 *
 * Shared by Button and IconButton so a press feels identical on both. The
 * host element needs the `fuji-ripple` class (see base.css) to clip the wave
 * to its own radius.
 *
 * Opacity ramps in with the expansion and out from wherever it got to. Both
 * halves are deliberate, and getting either wrong is what makes a ripple feel
 * aggressive: a wave that starts at full strength reads as a hard-edged disc
 * appearing out of nowhere, and a fade that animates from `opacity: 1` rather
 * than the value actually on screen flashes bright white on every release.
 */

/**
 * Held opacity of the wave. Measured against motion.dev's reference ripple,
 * which settles at 0.4 - but that is an accent tint on a transparent button,
 * where this is `currentColor` over a filled one, so it needs to sit lower to
 * read as the same weight.
 */
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
      // The Web Animations API is missing in jsdom, so a consumer's test that
      // clicks a Button would otherwise throw from inside the library. It is
      // decoration - skip it rather than making a press a hard error.
      if (typeof host.animate !== "function") return;
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Radius to the furthest corner, so the circle always reaches every
      // edge of the control however off-centre the press was.
      const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

      const node = document.createElement("span");
      node.className = "fuji-ripple-wave";
      node.style.left = `${x - radius}px`;
      node.style.top = `${y - radius}px`;
      node.style.width = node.style.height = `${radius * 2}px`;
      host.appendChild(node);
      active.current.add(node);

      // Opacity rides the same curve as the expansion, so the wave arrives as
      // it grows instead of snapping on at full strength.
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
          // Fade from what is actually on screen. A release during the
          // expansion catches the wave mid-ramp, and a literal `1` here would
          // jump it to near-opaque before fading.
          const from = Number.parseFloat(getComputedStyle(node).opacity) || PEAK_OPACITY;
          node.animate([{ opacity: from }, { opacity: 0 }], {
            duration: 320,
            easing: "linear",
            fill: "forwards",
          });
          // A timer, not `onfinish`: animation events need a rendering frame
          // to be dispatched, and a backgrounded tab gets none - the finished
          // (invisible) wave would stay in the DOM until the tab was shown.
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
