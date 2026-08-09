"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

type ResponsiveCount = number | Partial<Record<"base" | "sm" | "md" | "lg", number>>;

export interface CarouselHandle {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}

export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  children: React.ReactNode;
  /** Controlled active slide index. */
  index?: number;
  /** Uncontrolled initial index. Default 0. */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Overlay prev/next arrow controls. Default false. */
  controls?: boolean;
  /** Bottom dot indicators. Default true. */
  indicators?: boolean;
  /** Slides visible per view. A number, or a responsive map keyed by breakpoint. Default 1. */
  slidesPerView?: ResponsiveCount;
  /** Advance automatically. Paused on hover/focus/touch/tab-hidden. Default true. */
  autoplay?: boolean;
  /** Milliseconds between autoplay advances. Default 3000. */
  autoplayInterval?: number;
  /** Wrap seamlessly past the ends. Default true. */
  loop?: boolean;
  /** Allow touch/pointer swiping. Default true. */
  swipe?: boolean;
  /**
   * Per-slide transition length in ms. Defaults to the shared
   * `--fuji-duration-slow` token. Raise it close to `autoplayInterval` for a
   * continuous-feeling glide instead of a quick step with a long static
   * pause between advances.
   */
  transitionDuration?: number;
  /**
   * Renders an always-moving CSS-keyframe marquee instead of discrete
   * step-and-pause slides - a genuinely continuous scroll with no stop/start
   * feel. Ignores `index`/`defaultIndex`/`onIndexChange`/`controls`/
   * `indicators`/`loop`/`swipe`/`transitionDuration`; only `autoplayInterval`
   * (ms of travel per slide-width) and `slidesPerView` apply. Still pauses on
   * hover/focus, tab-hidden, and `prefers-reduced-motion`. Default false.
   */
  continuous?: boolean;
  "aria-label"?: string;
}

function usePrefersReducedMotion() {
  // Starts `false` on every render, server and client alike - `matchMedia` is a
  // browser-only API and must never be read during render (see AGENTS.md's SSR
  // rules). The real value is read and kept in sync from an effect below, which
  // never runs during SSR and only runs on the client after the initial paint.
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function resolvePerView(slidesPerView: ResponsiveCount) {
  if (typeof slidesPerView === "number") {
    return { base: slidesPerView, sm: slidesPerView, md: slidesPerView, lg: slidesPerView };
  }
  const base = slidesPerView.base ?? 1;
  const sm = slidesPerView.sm ?? base;
  const md = slidesPerView.md ?? sm;
  const lg = slidesPerView.lg ?? md;
  return { base, sm, md, lg };
}

/**
 * Tracks which responsive `per` value is active at the current viewport width,
 * mirroring the sm/md/lg breakpoints baked into the scoped `<style>` block
 * below. The non-looping max index, indicator count, and prev/next disabled
 * state all need this - using `per.base` alone left them locked to the
 * mobile slide count even once CSS had already expanded the visible slides
 * at wider breakpoints.
 */
function useActivePer(per: { base: number; sm: number; md: number; lg: number }) {
  const resolve = React.useCallback(() => {
    if (typeof window === "undefined") return per.base;
    if (window.matchMedia("(min-width: 1024px)").matches) return per.lg;
    if (window.matchMedia("(min-width: 768px)").matches) return per.md;
    if (window.matchMedia("(min-width: 640px)").matches) return per.sm;
    return per.base;
  }, [per.base, per.sm, per.md, per.lg]);

  // Match server output on first paint (no `window` access during that render),
  // then sync the real active breakpoint in an effect once mounted.
  const [activePer, setActivePer] = React.useState(per.base);

  React.useEffect(() => {
    const queries = [
      window.matchMedia("(min-width: 640px)"),
      window.matchMedia("(min-width: 768px)"),
      window.matchMedia("(min-width: 1024px)"),
    ];
    const update = () => setActivePer(resolve());
    update();
    queries.forEach((query) => query.addEventListener("change", update));
    // Belt-and-suspenders: also resync on a plain window resize, since a
    // resize doesn't always guarantee `change` fires on already-created
    // MediaQueryList objects.
    window.addEventListener("resize", update);
    return () => {
      queries.forEach((query) => query.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, [resolve]);

  return activePer;
}

/**
 * Explicit, persistent autoplay toggle (WCAG 2.2.2 Pause, Stop, Hide): hover
 * and focus already pause motion transiently, but neither gives a keyboard
 * user a way to stop it for good - especially when slides hold no focusable
 * content of their own to tab onto. `pressed` reflects the user's own choice,
 * independent of (and layered underneath) the hover/focus/tab-hidden pauses.
 */
function PlayPauseButton({
  pressed,
  onToggle,
  className,
}: {
  pressed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? "Play carousel" : "Pause carousel"}
      onClick={onToggle}
      className={cn(
        NATIVE_CONTROL_RESET,
        "fj:flex fj:size-8 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-overlay/80 fj:text-fuji-foreground fj:shadow-fuji-control fj:backdrop-blur-sm fj:transition-[color,opacity] fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground-muted",
        className,
      )}
    >
      {pressed ? (
        <Play aria-hidden="true" className="fj:size-4" />
      ) : (
        <Pause aria-hidden="true" className="fj:size-4" />
      )}
    </button>
  );
}

/**
 * One reusable carousel. Defaults to the basic preset (autoplay, progress dots,
 * no arrows). Pass `controls` for arrow navigation, `slidesPerView` for a
 * multi-slide layout, `loop`/`autoplay`/`autoplayInterval` to tune playback, or
 * `continuous` for an always-moving marquee. Movement is transform-based; loop
 * is seamless via edge clones (stepped mode) or a duplicated slide set
 * (continuous mode).
 */
export const Carousel = React.forwardRef<CarouselHandle, CarouselProps>(function Carousel(
  { continuous = false, ...props },
  ref,
) {
  if (continuous) {
    return <ContinuousCarousel {...props} ref={ref} />;
  }
  return <SteppedCarousel {...props} ref={ref} />;
});

const SteppedCarousel = React.forwardRef<CarouselHandle, Omit<CarouselProps, "continuous">>(
  function SteppedCarousel(
    {
      children,
      index,
      defaultIndex = 0,
      onIndexChange,
      controls = false,
      indicators = true,
      slidesPerView = 1,
      autoplay = true,
      autoplayInterval = 3000,
      loop = true,
      swipe = true,
      transitionDuration,
      className,
      "aria-label": ariaLabel = "Carousel",
      ...props
    },
    ref,
  ) {
    const slides = React.Children.toArray(children);
    const count = slides.length;
    const per = React.useMemo(() => resolvePerView(slidesPerView), [slidesPerView]);
    const cloneCount = Math.min(Math.max(per.base, per.sm, per.md, per.lg), Math.max(count, 1));
    const canLoop = loop && count > 1;
    // Bound the non-looping API by whichever slidesPerView is actually active
    // at the current viewport, not just the mobile `base` value, so it stays
    // in sync with the CSS breakpoint that really controls visible slide count.
    const activePer = useActivePer(per);
    const nonLoopMaxIndex = Math.max(count - Math.max(activePer, 1), 0);
    const reduceMotion = usePrefersReducedMotion();
    const styleId = React.useId().replace(/[^a-zA-Z0-9]/g, "");

    const [active, setActive] = useControllableState<number>({
      value: index,
      defaultValue: Math.min(Math.max(defaultIndex, 0), canLoop ? Math.max(count - 1, 0) : nonLoopMaxIndex),
      onChange: onIndexChange,
    });

    // `display` is the clone-offset position of the track; real index = display - cloneCount.
    const [display, setDisplay] = React.useState(active + (canLoop ? cloneCount : 0));
    const [animate, setAnimate] = React.useState(true);
    const [paused, setPaused] = React.useState(false);
    const [manuallyPaused, setManuallyPaused] = React.useState(false);
    const [tabHidden, setTabHidden] = React.useState(false);
    const draggingRef = React.useRef(false);
    const trackRef = React.useRef<HTMLDivElement>(null);

    // Keep `display` aligned when the active index changes from outside (a
    // controlled `index` prop), adjusting during render rather than in an effect.
    // Internal moves already keep the two in sync, so this only fires for external
    // changes (https://react.dev/learn/you-might-not-need-an-effect).
    const [prevActive, setPrevActive] = React.useState(active);
    if (prevActive !== active) {
      setPrevActive(active);
      const real = (((display - (canLoop ? cloneCount : 0)) % count) + count) % count;
      if (real !== active) {
        setAnimate(false);
        setDisplay(active + (canLoop ? cloneCount : 0));
      }
    }

    const commitIndex = React.useCallback(
      (nextIndex: number) => {
        if (canLoop) {
          setActive(((nextIndex % count) + count) % count);
        } else {
          setActive(Math.min(Math.max(nextIndex, 0), nonLoopMaxIndex));
        }
      },
      [canLoop, count, nonLoopMaxIndex, setActive],
    );

    const go = React.useCallback(
      (dir: 1 | -1) => {
        if (count <= 1) return;
        if (canLoop) {
          setAnimate(true);
          setDisplay((d) => d + dir);
        } else {
          commitIndex(active + dir);
        }
      },
      [count, canLoop, commitIndex, active],
    );

    const next = React.useCallback(() => go(1), [go]);
    const previous = React.useCallback(() => go(-1), [go]);
    // Indicator dots need the same animated slide as next/previous, not a
    // jump. Unlike `go`, this can move more than one position at once, so it
    // computes the shortest signed delta (wrapping through whichever clone
    // edge is nearer) and drives `display` directly - `commitIndex` alone
    // only ever touched `active`, leaving the render-time active/display
    // reconciliation below to snap the track with `animate(false)` instead
    // of sliding it.
    const goTo = React.useCallback(
      (i: number) => {
        if (!canLoop) {
          commitIndex(i);
          return;
        }
        const target = ((i % count) + count) % count;
        const currentReal = (((display - cloneCount) % count) + count) % count;
        let delta = target - currentReal;
        if (delta > count / 2) delta -= count;
        else if (delta < -count / 2) delta += count;
        setAnimate(true);
        setDisplay((d) => d + delta);
        setActive(target);
      },
      [canLoop, count, cloneCount, display, commitIndex, setActive],
    );

    React.useImperativeHandle(ref, () => ({ next, previous, goTo }), [next, previous, goTo]);

    // After a looped transition into the clone region, jump (without animation)
    // back to the equivalent real slide so infinite mode never visibly jumps.
    const handleTransitionEnd = React.useCallback(() => {
      if (!canLoop) return;
      const real = display - cloneCount;
      if (real < 0 || real > count - 1) {
        const wrapped = ((real % count) + count) % count;
        setAnimate(false);
        setDisplay(wrapped + cloneCount);
        setActive(wrapped);
      } else if (real !== active) {
        setActive(real);
      }
    }, [canLoop, display, cloneCount, count, active, setActive]);

    // Re-enable animation on the frame after a no-animation clone reset.
    React.useEffect(() => {
      if (animate) return;
      const raf = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf);
    }, [animate]);

    // Single autoplay timer, re-armed only by the inputs that should change its
    // cadence. `go` is read through a ref so an active-index update after each
    // transition (which changes `go`'s identity) can't restart the interval and
    // stack extra delay onto every tick.
    const goRef = React.useRef(go);
    React.useEffect(() => {
      goRef.current = go;
    }, [go]);
    React.useEffect(() => {
      if (!autoplay || paused || manuallyPaused || tabHidden || reduceMotion || count <= 1) return;
      const id = window.setInterval(() => goRef.current(1), autoplayInterval);
      return () => window.clearInterval(id);
    }, [autoplay, paused, manuallyPaused, tabHidden, reduceMotion, count, autoplayInterval]);

    // If the viewport shrinks to a breakpoint with fewer visible slides, pull
    // an out-of-range active index back to the new (smaller) max so it can't
    // point past the last valid non-looping position.
    React.useEffect(() => {
      if (canLoop) return;
      if (active > nonLoopMaxIndex) setActive(nonLoopMaxIndex);
    }, [canLoop, nonLoopMaxIndex, active, setActive]);

    // Track tab visibility as a separate pause source.
    React.useEffect(() => {
      const onVisibility = () => setTabHidden(document.hidden);
      document.addEventListener("visibilitychange", onVisibility);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    const rendered = canLoop
      ? [...slides.slice(count - cloneCount), ...slides, ...slides.slice(0, cloneCount)]
      : slides;
    const realIndex = active;

    const translate = canLoop
      ? `calc(${display} * (-100% / var(--fuji-cv-per)))`
      : `max(calc(${display} * (-100% / var(--fuji-cv-per))), calc((var(--fuji-cv-count) - var(--fuji-cv-per)) * (-100% / var(--fuji-cv-per))))`;

    const showProgress = autoplay && !reduceMotion && !paused && !manuallyPaused && !tabHidden && count > 1;

    // Pointer swipe.
    const pointerStart = React.useRef<number | null>(null);
    const onPointerDown = (event: React.PointerEvent) => {
      if (!swipe || count <= 1) return;
      pointerStart.current = event.clientX;
      draggingRef.current = true;
      setPaused(true);
    };
    const onPointerUp = (event: React.PointerEvent) => {
      if (!swipe || pointerStart.current === null) return;
      const delta = event.clientX - pointerStart.current;
      pointerStart.current = null;
      draggingRef.current = false;
      setPaused(false);
      if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    };

    const atStart = !canLoop && realIndex <= 0;
    const atEnd = !canLoop && realIndex >= nonLoopMaxIndex;

    return (
      <div
        className={cn("fj:relative", className)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
        }}
        {...props}
      >
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.base};--fuji-cv-count:${count};--fuji-cv-duration:${transitionDuration ? `${transitionDuration}ms` : "var(--fuji-duration-slow)"}}@media(min-width:640px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.sm}}}@media(min-width:768px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.md}}}@media(min-width:1024px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.lg}}}`,
          }}
        />
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- WAI-ARIA Carousel pattern: a focusable region with arrow-key navigation (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/). */}
        <div
          data-fuji-carousel={styleId}
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- same WAI-ARIA Carousel pattern as above.
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              next();
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              previous();
            }
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
            draggingRef.current = false;
            setPaused(false);
          }}
          className="fj:overflow-hidden fj:rounded-fuji-panel fj:outline-none fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring"
        >
          <div
            ref={trackRef}
            className="fj:flex fj:touch-pan-y"
            style={{
              transform: `translateX(${translate})`,
              transition:
                animate && !reduceMotion ? "transform var(--fuji-cv-duration) var(--fuji-ease)" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {rendered.map((child, childIndex) => {
              const realSlide = canLoop ? (((childIndex - cloneCount) % count) + count) % count : childIndex;
              const isClone = canLoop && (childIndex < cloneCount || childIndex >= cloneCount + count);
              return (
                <div
                  key={childIndex}
                  // Set as a real DOM property via ref rather than the JSX
                  // `inert` attribute: React 19 treats it as a strict
                  // boolean (an empty string reads as `false`), while
                  // React 18 doesn't recognize it as boolean at all and
                  // warns - assigning the DOM property directly sidesteps
                  // both, since it's supported natively either way.
                  ref={(node) => {
                    if (node) node.inert = isClone;
                  }}
                  role="group"
                  aria-hidden={isClone || undefined}
                  aria-roledescription="slide"
                  aria-label={`Slide ${realSlide + 1} of ${count}`}
                  className="fj:w-[calc(100%/var(--fuji-cv-per))] fj:shrink-0 fj:px-1.5 fj:first:pl-0 fj:last:pr-0"
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>

        {controls && count > 1 && (
          <>
            <div className="fj:absolute fj:top-1/2 fj:left-2 fj:-translate-y-1/2">
              <button
                type="button"
                aria-label="Previous slide"
                disabled={atStart}
                onClick={previous}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:flex fj:size-8 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:text-fuji-foreground fj:transition-[color,opacity] fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground-muted fj:disabled:cursor-not-allowed fj:disabled:opacity-35",
                )}
              >
                <ChevronLeft className="fj:size-5" />
              </button>
            </div>
            <div className="fj:absolute fj:top-1/2 fj:right-2 fj:-translate-y-1/2">
              <button
                type="button"
                aria-label="Next slide"
                disabled={atEnd}
                onClick={next}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:flex fj:size-8 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:text-fuji-foreground fj:transition-[color,opacity] fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground-muted fj:disabled:cursor-not-allowed fj:disabled:opacity-35",
                )}
              >
                <ChevronRight className="fj:size-5" />
              </button>
            </div>
          </>
        )}

        {autoplay && count > 1 && (
          <div className="fj:absolute fj:top-2 fj:right-2">
            <PlayPauseButton pressed={manuallyPaused} onToggle={() => setManuallyPaused((value) => !value)} />
          </div>
        )}

        {indicators && count > 1 && (
          <div className="fj:mt-3 fj:flex fj:items-center fj:justify-center fj:gap-1.5">
            {slides.slice(0, canLoop ? count : nonLoopMaxIndex + 1).map((_, dotIndex) => {
              const isActive = dotIndex === realIndex;
              return (
                <button
                  key={dotIndex}
                  type="button"
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  aria-current={isActive}
                  onClick={() => goTo(dotIndex)}
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:h-1.5 fj:cursor-pointer fj:overflow-hidden fj:rounded-full fj:transition-[width,background-color] fj:duration-[var(--fuji-duration-base)]",
                    isActive
                      ? "fj:w-6 fj:bg-fuji-border-strong"
                      : "fj:w-1.5 fj:bg-fuji-border-strong fj:hover:bg-fuji-foreground-subtle",
                  )}
                >
                  {isActive && (
                    <span
                      key={`${realIndex}-${paused}-${manuallyPaused}`}
                      className="fj:block fj:h-full fj:rounded-full fj:bg-fuji-foreground"
                      style={
                        showProgress
                          ? {
                              animation: `fuji-carousel-progress ${autoplayInterval}ms linear forwards`,
                            }
                          : { width: "100%" }
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

/**
 * Always-moving marquee: the slide set is duplicated once and animated with a
 * scoped, linear, infinite CSS keyframe (no JS timers, no discrete "step then
 * pause" position), so it never reads as stopping. The `-100% / var(--fuji-cv-per)`
 * unit matches the translate convention SteppedCarousel uses for one
 * slide-width, so travelling `count` of those units advances exactly one full
 * lap before the duplicated content makes the wrap invisible.
 */
const ContinuousCarousel = React.forwardRef<CarouselHandle, Omit<CarouselProps, "continuous">>(
  function ContinuousCarousel(
    {
      children,
      slidesPerView = 1,
      autoplayInterval = 3000,
      className,
      "aria-label": ariaLabel = "Carousel",
      ...rest
    },
    ref,
  ) {
    // Discrete-mode-only props are accepted (so callers can share a single
    // prop object with SteppedCarousel usages) but have no effect here; strip
    // them so they don't leak onto the wrapper <div> below.
    const props = { ...rest };
    delete props.index;
    delete props.defaultIndex;
    delete props.onIndexChange;
    delete props.controls;
    delete props.indicators;
    delete props.autoplay;
    delete props.loop;
    delete props.swipe;
    delete props.transitionDuration;

    const slides = React.Children.toArray(children);
    const count = slides.length;
    const per = React.useMemo(() => resolvePerView(slidesPerView), [slidesPerView]);
    const reduceMotion = usePrefersReducedMotion();
    const styleId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
    const [paused, setPaused] = React.useState(false);
    const [manuallyPaused, setManuallyPaused] = React.useState(false);
    const [tabHidden, setTabHidden] = React.useState(false);

    React.useImperativeHandle(ref, () => ({ next: () => {}, previous: () => {}, goTo: () => {} }), []);

    React.useEffect(() => {
      const onVisibility = () => setTabHidden(document.hidden);
      document.addEventListener("visibilitychange", onVisibility);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    const durationMs = autoplayInterval * Math.max(count, 1);
    const running = count > 1 && !reduceMotion;
    const rendered = count > 1 ? [...slides, ...slides] : slides;

    return (
      <div
        className={cn("fj:relative", className)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
        }}
        {...props}
      >
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.base};--fuji-cv-count:${count}}@media(min-width:640px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.sm}}}@media(min-width:768px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.md}}}@media(min-width:1024px){[data-fuji-carousel="${styleId}"]{--fuji-cv-per:${per.lg}}}`,
          }}
        />
        <div
          data-fuji-carousel={styleId}
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          className="fj:overflow-hidden fj:rounded-fuji-panel"
        >
          <div
            className="fj:flex"
            style={
              running
                ? {
                    // Shared, global keyframe (tokens.css) - see its own comment for why
                    // this doesn't need a per-instance name like `--fuji-cv-per` does.
                    animation: `fuji-cv-marquee ${durationMs}ms linear infinite`,
                    animationPlayState: paused || manuallyPaused || tabHidden ? "paused" : "running",
                  }
                : undefined
            }
          >
            {rendered.map((child, childIndex) => {
              const isClone = childIndex >= count;
              return (
                <div
                  key={childIndex}
                  // See the equivalent ref in SteppedCarousel above for why
                  // `inert` is set as a DOM property here instead of a JSX prop.
                  ref={(node) => {
                    if (node) node.inert = isClone;
                  }}
                  role="group"
                  aria-hidden={isClone || undefined}
                  aria-roledescription="slide"
                  aria-label={`Slide ${(childIndex % count) + 1} of ${count}`}
                  className="fj:w-[calc(100%/var(--fuji-cv-per))] fj:shrink-0 fj:px-1.5"
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>

        {running && (
          <div className="fj:absolute fj:top-2 fj:right-2">
            <PlayPauseButton pressed={manuallyPaused} onToggle={() => setManuallyPaused((value) => !value)} />
          </div>
        )}
      </div>
    );
  },
);
