"use client";

import * as React from "react";

/**
 * The pointer-tracking half of `<Card effect="tilt">` (the reference is
 * motion.dev's tilt-card example).
 *
 * This lives in its own file, and `Card` imports it, because `Card` must NOT
 * carry a `"use client"` directive: consumers pass `Card` itself as a prop
 * from Server Components, which breaks the moment the module becomes a client
 * module. Only the tilt variant needs the client boundary, so only the tilt
 * variant crosses it.
 *
 * Motion drives its version with a spring rather than a CSS transition, which
 * matters: a transition restarts on every pointer move and the card visibly
 * chases the cursor in steps. Here a small critically-damped approach runs on
 * `requestAnimationFrame` instead - no animation library, no runtime
 * dependency - and the loop parks itself once the card has settled at rest.
 */

/** Peak rotation at the corners. Measured off the reference, which lands ~7deg. */
const MAX_TILT_DEG = 7;
/** Pushes the card back slightly while pointed at, for a little depth. */
const LIFT_Z_PX = 10;
/** Fraction of the remaining distance covered per frame. */
const APPROACH = 0.18;
/** Below this, the difference is sub-pixel - snap and stop the loop. */
const EPSILON = 0.01;

interface Vec {
  rotateX: number;
  rotateY: number;
  z: number;
}

const NEUTRAL: Vec = { rotateX: 0, rotateY: 0, z: 0 };

export const CardTilt = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardTilt({ onPointerMove, onPointerLeave, onBlur, ...props }, forwardedRef) {
    const nodeRef = React.useRef<HTMLDivElement | null>(null);
    const target = React.useRef<Vec>(NEUTRAL);
    const current = React.useRef<Vec>(NEUTRAL);
    const frame = React.useRef<number | null>(null);

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    React.useEffect(() => {
      return () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      };
    }, []);

    const tick = React.useCallback(() => {
      frame.current = null;
      const node = nodeRef.current;
      if (!node) return;
      const to = target.current;
      const at = current.current;
      const next: Vec = {
        rotateX: at.rotateX + (to.rotateX - at.rotateX) * APPROACH,
        rotateY: at.rotateY + (to.rotateY - at.rotateY) * APPROACH,
        z: at.z + (to.z - at.z) * APPROACH,
      };
      const settled =
        Math.abs(to.rotateX - next.rotateX) < EPSILON &&
        Math.abs(to.rotateY - next.rotateY) < EPSILON &&
        Math.abs(to.z - next.z) < EPSILON;
      current.current = settled ? to : next;
      const { rotateX, rotateY, z } = current.current;
      // Neutral clears the property entirely rather than writing an identity
      // transform, so a card at rest composites exactly as it would without
      // the tilt variant at all.
      node.style.transform =
        settled && to === NEUTRAL
          ? ""
          : `perspective(500px) translateZ(${-z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      if (!settled) frame.current = requestAnimationFrame(tick);
    }, []);

    const aim = React.useCallback(
      (next: Vec) => {
        target.current = next;
        if (frame.current === null) frame.current = requestAnimationFrame(tick);
      },
      [tick],
    );

    return (
      <div
        ref={setRef}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          // A coarse pointer has no hover to track - a touch would pin the
          // card to wherever the finger landed and leave it there.
          if (event.pointerType === "touch") return;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          // -0.5..0.5 from the card's centre.
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          aim({
            // Pointer above centre tips the top edge away from the viewer,
            // which is a positive rotateX - hence the sign flip on Y.
            rotateX: -py * MAX_TILT_DEG * 2,
            rotateY: px * MAX_TILT_DEG * 2,
            z: LIFT_Z_PX,
          });
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          aim(NEUTRAL);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          aim(NEUTRAL);
        }}
        {...props}
      />
    );
  },
);
