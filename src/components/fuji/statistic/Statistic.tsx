"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Card } from "../card/Card";

export interface StatisticProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  label: React.ReactNode;
  /** A number animates with a count-up on first view; any other ReactNode renders statically. */
  value: number | React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** Decimal places used when animating a numeric value. Defaults to 0. */
  decimals?: number;
  /** Positive shows an up arrow in success color, negative a down arrow in danger. */
  trend?: number;
  trendLabel?: string;
  /** Wraps the tile in `Card`'s bordered/shadowed surface. Default false. */
  card?: boolean;
}

const COUNT_UP_MS = 700;

function useCountUp(target: number, decimals: number) {
  const [display, setDisplay] = React.useState(0);
  // Mirrors `display` synchronously (state updates aren't readable until the
  // next render), so a later `target` change can animate from wherever the
  // count actually is instead of resetting to 0 and counting up again.
  const displayRef = React.useRef(0);
  const ref = React.useRef<HTMLParagraphElement>(null);
  // Whether the node has ever been observed as visible - not whether it has
  // *finished* animating. Once true, later `target` changes animate/update
  // immediately instead of running the reveal-on-first-view IntersectionObserver
  // again, since the element is already known to be on screen.
  const hasBeenVisible = React.useRef(false);

  const commitDisplay = React.useCallback((value: number) => {
    displayRef.current = value;
    setDisplay(value);
  }, []);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame: number;
    const animateTo = () => {
      const from = displayRef.current;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        commitDisplay(target);
        return;
      }

      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / COUNT_UP_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        commitDisplay(from + (target - from) * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (hasBeenVisible.current) {
      animateTo();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        hasBeenVisible.current = true;
        observer.disconnect();
        animateTo();
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, commitDisplay]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return { ref, formatted };
}

/** Label + big value + optional trend indicator - for dashboard KPI tiles. */
export const Statistic = React.forwardRef<HTMLDivElement, StatisticProps>(function Statistic(
  { label, value, prefix, suffix, decimals = 0, trend, trendLabel, card = false, className, ...props },
  ref,
) {
  const isNumeric = typeof value === "number";
  const { ref: valueRef, formatted } = useCountUp(isNumeric ? value : 0, decimals);
  const Wrapper = card ? Card : "div";

  return (
    <Wrapper ref={ref} className={cn("fj:flex fj:flex-col fj:gap-1.5", className)} {...props}>
      <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">{label}</p>
      <p
        ref={isNumeric ? valueRef : undefined}
        className="fj:m-0 fj:text-[length:var(--fuji-text-2xl)] fj:font-semibold fj:tracking-tight fj:text-fuji-foreground fj:tabular-nums"
      >
        {prefix}
        {isNumeric ? formatted : value}
        {suffix}
      </p>
      {trend !== undefined && (
        <p
          className={cn(
            "fj:flex fj:items-center fj:gap-1 fj:text-[length:var(--fuji-text-sm)] fj:font-medium",
            trend >= 0 ? "fj:text-fuji-forest" : "fj:text-fuji-fire",
          )}
        >
          {trend >= 0 ? <ArrowUp className="fj:size-3.5" /> : <ArrowDown className="fj:size-3.5" />}
          {Math.abs(trend)}%
          {trendLabel && <span className="fj:font-normal fj:text-fuji-foreground-subtle">{trendLabel}</span>}
        </p>
      )}
    </Wrapper>
  );
});
