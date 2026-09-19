"use client";

import * as React from "react";

/**
 * Client half of `<Card effect="tilt">`, split out so `Card` stays server-renderable. A damped rAF
 * loop, not a CSS transition (which restarts per pointer move and chases in steps); parks at rest.
 */

/** Peak corner rotation. The reference's ~7deg read as a toy on big cards: lean, don't swing. */
const MAX_TILT_DEG = 3;
/** Viewing distance: shorter exaggerates foreshortening, warping big cards even at small angles. */
const PERSPECTIVE_PX = 1200;
/** Pushes the card back slightly while pointed at, for a little depth. */
const LIFT_Z_PX = 4;
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
      // At rest, clear the property (not an identity transform) so it composites like a plain card.
      node.style.transform =
        settled && to === NEUTRAL
          ? ""
          : `perspective(${PERSPECTIVE_PX}px) translateZ(${-z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
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
          // Touch has no hover: the card would stay pinned where the finger landed.
          if (event.pointerType === "touch") return;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          // -0.5..0.5 from the card's centre.
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          aim({
            // Pointer above centre tips the top edge away (positive rotateX), hence the Y sign flip.
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
