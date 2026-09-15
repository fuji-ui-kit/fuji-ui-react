"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Card } from "../card/Card";

export interface StatisticProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** What the figure measures. */
  label: React.ReactNode;
  /** A number animates with a count-up on first view; any other ReactNode renders statically. */
  value: number | React.ReactNode;
  /** Rendered immediately before the figure - a currency symbol. */
  prefix?: React.ReactNode;
  /** Rendered immediately after the figure - a unit or a percent sign. */
  suffix?: React.ReactNode;
  /** Decimal places used when animating a numeric value. Defaults to 0. */
  decimals?: number;
  /** Positive shows an up arrow in success color, negative a down arrow in danger. */
  trend?: number;
  /** What the trend is measured against, printed after it ("MoM", "vs last week"). */
  trendLabel?: string;
  /** Wraps the tile in `Card`'s bordered/shadowed surface. Default false. */
  card?: boolean;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * The value as a row of characters. Each DIGIT is a fixed-height cell holding
 * a vertical strip of 0-9, translated so the current digit shows; changing
 * `--fuji-digit` rolls the strip on the shared spring (see `.fuji-digit` in
 * base.css). Separators, prefix and suffix are plain cells of the same height
 * so every glyph shares one baseline.
 *
 * The markup always carries the FINAL value (server render included); the
 * reveal-on-first-view roll below only rewinds the strips to 0 and releases
 * them, it never changes what the DOM says the number is.
 */
function RollingNumber({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, index) => {
        const digit = DIGITS.indexOf(char);
        if (digit === -1) {
          return (
            <span key={index} className="fuji-digit fuji-digit-static">
              {char}
            </span>
          );
        }
        return (
          <span
            key={index}
            className="fuji-digit"
            style={{ "--fuji-digit": digit, "--fuji-digit-index": index } as React.CSSProperties}
          >
            <span className="fuji-digit-strip" aria-hidden="true">
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
            <span className="fj:sr-only">{char}</span>
          </span>
        );
      })}
    </>
  );
}

function useNumberTrend(target: number) {
  const ref = React.useRef<HTMLElement>(null);
  const previous = React.useRef<number | null>(null);
  const revealed = React.useRef(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Flash the whole figure toward the trend colour while it rolls - the
    // "number trend" cue. `data-trend` is cleared after the roll settles.
    const flash = (direction: "up" | "down") => {
      node.setAttribute("data-trend", direction);
      const t = window.setTimeout(() => node.removeAttribute("data-trend"), 900);
      return () => window.clearTimeout(t);
    };

    if (previous.current !== null && previous.current !== target) {
      const cleanup = flash(target > previous.current ? "up" : "down");
      previous.current = target;
      return cleanup;
    }
    previous.current = target;
    if (revealed.current || reduce) return;

    // First view: rewind every strip to 0 with transitions off, force a
    // layout so that state is painted, then let the real values roll in.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        revealed.current = true;
        const strips = node.querySelectorAll<HTMLElement>(".fuji-digit-strip");
        strips.forEach((strip) => {
          strip.style.transition = "none";
          strip.style.transform = "translateY(0)";
        });
        void node.offsetHeight;
        strips.forEach((strip) => {
          strip.style.transition = "";
          strip.style.transform = "";
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return ref;
}

/** Label + big value + optional trend indicator - for dashboard KPI tiles. */
export const Statistic = React.forwardRef<HTMLDivElement, StatisticProps>(function Statistic(
  { label, value, prefix, suffix, decimals = 0, trend, trendLabel, card = false, className, ...props },
  ref,
) {
  const isNumeric = typeof value === "number";
  const numberRef = useNumberTrend(isNumeric ? value : 0);
  const Wrapper = card ? Card : "div";
  const formatted = isNumeric
    ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : null;
  // String prefix/suffix ride inside the roller so they share its baseline;
  // a ReactNode prefix (an icon) is rendered beside it instead.
  const inlinePrefix = typeof prefix === "string" ? prefix : "";
  const inlineSuffix = typeof suffix === "string" ? suffix : "";

  return (
    <Wrapper ref={ref} className={cn("fj:flex fj:flex-col fj:gap-1.5", className)} {...props}>
      <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">{label}</p>
      <p className="fj:m-0 fj:flex fj:items-baseline fj:gap-0.5 fj:text-[length:var(--fuji-text-2xl)] fj:font-semibold fj:tracking-tight fj:text-fuji-foreground fj:tabular-nums">
        {typeof prefix !== "string" && prefix}
        {isNumeric ? (
          <span
            ref={numberRef}
            className="fuji-number"
            aria-label={`${inlinePrefix}${formatted}${inlineSuffix}`}
          >
            <RollingNumber text={`${inlinePrefix}${formatted}${inlineSuffix}`} />
          </span>
        ) : (
          value
        )}
        {typeof suffix !== "string" && suffix}
      </p>
      {trend !== undefined && (
        <p
          className={cn(
            "fj:m-0 fj:flex fj:items-center fj:gap-1 fj:text-[length:var(--fuji-text-sm)] fj:font-medium",
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
