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
  /** The slides. Each child becomes one slide. */
  children: React.ReactNode;
  /** Controlled active slide index. */
  index?: number;
  /** Uncontrolled initial index. Default 0. */
  defaultIndex?: number;
  /** Called with the new index whenever the active slide changes, however it changed. */
  onIndexChange?: (index: number) => void;
  /** Overlay prev/next arrow controls. Default false. */
  controls?: boolean;
  /** Bottom dot indicators. Default true. */
  indicators?: boolean;
  /**
   * Slides per view: a number or breakpoint map. Default 1 - or 1.6 with `effect="coverflow"`, where
   * it sets the centre width (`100% / slidesPerView`; 1.6 is ~62%, 3 shows more fan; min 1).
   */
  slidesPerView?: ResponsiveCount;
  /**
   * Advance automatically; paused on hover/focus/touch/tab-hidden, off under reduced motion. Defaults
   * to **false** (since 0.3.0): self-starting motion over 5s is a WCAG 2.2.2 duty, so it's opt-in.
   */
  autoplay?: boolean;
  /** Milliseconds between autoplay advances. Default 3000. */
  autoplayInterval?: number;
  /** Wrap seamlessly past the ends. Default true. */
  loop?: boolean;
  /** Allow touch/pointer swiping. Default true. */
  swipe?: boolean;
  /**
   * Per-slide transition length in ms. Defaults to the shared `--fuji-duration-slow` token. Raise it
   * towards `autoplayInterval` for a continuous glide instead of a quick step and a long pause.
   */
  transitionDuration?: number;
  /**
   * Always-moving CSS marquee instead of stepped slides; only `autoplayInterval` (ms per slide-width)
   * and `slidesPerView` apply. Pauses on hover/focus, tab-hidden and reduced motion. Default false.
   */
  continuous?: boolean;
  /**
   * `"coverflow"` ports motion.dev's: a centred ~62% slide, neighbours rotated 20° and shrunk to 70%,
   * faded edges, following the drag then snapping. Default `"slide"`.
   */
  effect?: "slide" | "coverflow";
  "aria-label"?: string;
}

/**
 * Prev/next arrows sit on the play/pause control's translucent disc: a bare chevron over a
 * photograph is invisible half the time.
 */
const ARROW_CLASSES =
  "fj:flex fj:size-9 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-overlay/85 fj:text-fuji-foreground fj:shadow-fuji-control fj:backdrop-blur-sm fj:transition-[transform,opacity,box-shadow] fj:duration-[var(--fuji-duration-fast)] fj:hover:shadow-fuji-control-hover fj:active:scale-[var(--fuji-press-scale)] fj:disabled:cursor-not-allowed fj:disabled:opacity-35 fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring";

/** Default coverflow slide width as a `--fuji-cv-per` divisor: 100% / 1.6 = 62.5%. */
const COVERFLOW_PER = 1.6;

function usePrefersReducedMotion() {
  // SSR-safe: starts `false` everywhere, since `matchMedia` must never be read during render
  // (AGENTS.md SSR rules); the effect syncs the real value after mount.
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
 * Active `per` at the current width, mirroring `.fuji-carousel`'s breakpoints (base.css): max index,
 * dot count and arrow state stayed locked to the mobile count when read from `per.base`.
 */
function useActivePer(per: { base: number; sm: number; md: number; lg: number }) {
  const resolve = React.useCallback(() => {
    if (typeof window === "undefined") return per.base;
    if (window.matchMedia("(min-width: 1024px)").matches) return per.lg;
    if (window.matchMedia("(min-width: 768px)").matches) return per.md;
    if (window.matchMedia("(min-width: 640px)").matches) return per.sm;
    return per.base;
  }, [per.base, per.sm, per.md, per.lg]);

  // Match server output on first paint, then sync the real breakpoint once mounted.
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
    // Also resync on resize: `change` isn't guaranteed to fire on existing MediaQueryLists.
    window.addEventListener("resize", update);
    return () => {
      queries.forEach((query) => query.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, [resolve]);

  return activePer;
}

/**
 * Persistent autoplay toggle (WCAG 2.2.2): hover/focus pauses are transient, so keyboard users need
 * a real stop. `pressed` is the user's choice, layered under the hover/focus/tab-hidden pauses.
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
        // Sits on slide media (Apple's HIG "visually rich backgrounds" case), so it takes the full
        // overlay material: a thinned tint plus a 4px blur left an invisible glyph on bright photos.
        "fuji-glass-surface-overlay fj:flex fj:size-8 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-overlay fj:text-fuji-foreground fj:shadow-fuji-control fj:transition-[color,opacity] fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground-muted",
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
 * Carousel: dots, no arrows, no autoplay by default. Transform-based; loops seamlessly via edge
 * clones (stepped) or a duplicated slide set (`continuous` marquee).
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
      slidesPerView,
      effect = "slide",
      autoplay = false,
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
    const coverflow = effect === "coverflow";
    const per = React.useMemo(() => {
      if (!coverflow) return resolvePerView(slidesPerView ?? 1);
      // Clamped to 1: a centre slide wider than the viewport has nothing to fan out from.
      if (slidesPerView === undefined) {
        return { base: COVERFLOW_PER, sm: COVERFLOW_PER, md: COVERFLOW_PER, lg: COVERFLOW_PER };
      }
      const resolved = resolvePerView(slidesPerView);
      return {
        base: Math.max(resolved.base, 1),
        sm: Math.max(resolved.sm, 1),
        md: Math.max(resolved.md, 1),
        lg: Math.max(resolved.lg, 1),
      };
    }, [slidesPerView, coverflow]);
    // Whole slides only (a fractional `per` like 1.6 would slice clones mid-array); coverflow
    // needs a neighbour on BOTH sides, hence at least two.
    const cloneCount = Math.min(
      Math.max(Math.ceil(Math.max(per.base, per.sm, per.md, per.lg)), coverflow ? 2 : 1),
      Math.max(count, 1),
    );
    const canLoop = loop && count > 1;
    const activePer = useActivePer(per);
    // Coverflow centres the active slide, so any slide can be active; the flat preset stops early
    // to keep the final page full.
    const nonLoopMaxIndex = coverflow ? Math.max(count - 1, 0) : Math.max(count - Math.max(activePer, 1), 0);
    const reduceMotion = usePrefersReducedMotion();

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
    const trackRef = React.useRef<HTMLDivElement>(null);

    // Realign `display` during render (not an effect) when a controlled `index` changes from
    // outside; internal moves already keep the two in sync.
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
    // Dots animate like next/previous: take the shortest signed delta (wrapping via the nearer
    // clone edge) and drive `display` directly - `commitIndex` alone let the render-time
    // reconciliation snap the track instead of sliding it.
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

    // After a looped transition into the clone region, snap back to the equivalent real slide.
    const handleTransitionEnd = React.useCallback(
      (event?: React.TransitionEvent) => {
        // Track's own transition only: coverflow slides (N+1 calls per move) and slide content
        // (a Card's hover shadow) bubble here too and could trigger a clone reset.
        if (event && event.target !== event.currentTarget) return;
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
      },
      [canLoop, display, cloneCount, count, active, setActive],
    );

    // Re-enable animation on the frame after a no-animation clone reset.
    React.useEffect(() => {
      if (animate) return;
      const raf = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf);
    }, [animate]);

    // Reduced motion: no transition means no `transitionend`, which loop mode relies on to commit
    // `active` and leave the clone region - so settle synchronously when `display` moves.
    React.useEffect(() => {
      if (!reduceMotion) return;
      handleTransitionEnd();
    }, [reduceMotion, display, handleTransitionEnd]);

    // One autoplay timer. `go` is read via a ref: its identity changes after every transition, and
    // re-arming the interval on that would stack extra delay onto each tick.
    const goRef = React.useRef(go);
    React.useEffect(() => {
      goRef.current = go;
    }, [go]);
    React.useEffect(() => {
      if (!autoplay || paused || manuallyPaused || tabHidden || reduceMotion || count <= 1) return;
      const id = window.setInterval(() => goRef.current(1), autoplayInterval);
      return () => window.clearInterval(id);
    }, [autoplay, paused, manuallyPaused, tabHidden, reduceMotion, count, autoplayInterval]);

    // Clamp `active` when a narrower breakpoint lowers the non-looping max.
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

    // Coverflow offsets the track by half the leftover width to centre the active slide.
    const peek = coverflow ? " + (100% - 100% / var(--fuji-cv-per)) / 2" : "";
    const drag = " + var(--fuji-cv-drag, 0px)";
    const translate =
      canLoop || coverflow
        ? `calc(${display} * (-100% / var(--fuji-cv-per))${peek}${drag})`
        : `calc(max(calc(${display} * (-100% / var(--fuji-cv-per))), calc((var(--fuji-cv-count) - var(--fuji-cv-per)) * (-100% / var(--fuji-cv-per))))${drag})`;

    const showProgress = autoplay && !reduceMotion && !paused && !manuallyPaused && !tabHidden && count > 1;

    // Swipe: the track follows the pointer 1:1 via `--fuji-cv-drag` written to the DOM (no state per
    // pointermove), plus a fractional `--fuji-cv-offset` per coverflow slide so the fan rotates
    // continuously; release snaps to the nearest slide.
    const pointerStart = React.useRef<number | null>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const dragPx = React.useRef(0);
    const displayRef = React.useRef(display);
    displayRef.current = display;
    // Read by `applyDrag` per pointermove; a ref so the callback stays stable.
    const activePerRef = React.useRef(activePer);
    activePerRef.current = activePer;

    const applyDrag = React.useCallback(
      (px: number) => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track) return;
        dragPx.current = px;
        track.style.setProperty("--fuji-cv-drag", `${px}px`);
        if (!coverflow) return;
        // `viewportWidth` is read at pointerdown: `clientWidth` here would force a layout per move.
        const slideWidth = viewportWidth.current / Math.max(activePerRef.current, 1);
        const fraction = slideWidth > 0 ? px / slideWidth : 0;
        const slides = track.children;
        for (let childIndex = 0; childIndex < slides.length; childIndex++) {
          const node = slides[childIndex] as HTMLElement;
          const offset = childIndex - displayRef.current + fraction;
          node.style.setProperty("--fuji-cv-offset", String(offset));
          node.style.zIndex = String(1000 - Math.round(Math.abs(offset) * 100));
        }
      },
      [coverflow],
    );
    const viewportWidth = React.useRef(0);

    // A press that never moved 4px (no capture) then left would leave autoplay paused.
    const cancelPress = () => {
      if (pointerStart.current === null || viewportRef.current?.hasAttribute("data-swiping")) return;
      pointerStart.current = null;
      setPaused(false);
    };

    /** Ends a drag. `commit` is false on `pointercancel`: snap back, don't act on half a swipe. */
    const endDrag = (event: React.PointerEvent, commit = true) => {
      if (pointerStart.current === null) return;
      const viewport = viewportRef.current;
      // Last applied offset, NOT `event.clientX`: `pointercancel` reports 0 in Chrome, which read
      // as a drag to the left edge and threw the carousel several slides forward.
      const px = dragPx.current;
      pointerStart.current = null;
      viewport?.removeAttribute("data-swiping");
      if (viewport?.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      setPaused(false);
      applyDrag(0);
      if (!viewport || !commit) return;
      const slideWidth = viewportWidth.current / Math.max(activePer, 1);
      // Nearest slide, but a short flick still counts for one.
      let delta = -Math.round(px / Math.max(slideWidth, 1));
      if (delta === 0 && Math.abs(px) > 40) delta = px < 0 ? 1 : -1;
      if (delta === 0) return;
      if (canLoop) {
        delta = Math.max(-cloneCount, Math.min(cloneCount, delta));
        setAnimate(true);
        setDisplay((d) => d + delta);
      } else {
        commitIndex(active + delta);
      }
    };

    const onPointerDown = (event: React.PointerEvent) => {
      if (!swipe || count <= 1 || event.button !== 0) return;
      pointerStart.current = event.clientX;
      dragPx.current = 0;
      viewportWidth.current = event.currentTarget.clientWidth;
      setPaused(true);
    };
    const onPointerMove = (event: React.PointerEvent) => {
      if (pointerStart.current === null) return;
      const px = event.clientX - pointerStart.current;
      const viewport = viewportRef.current;
      if (!viewport) return;
      if (!viewport.hasAttribute("data-swiping")) {
        // A few pixels of slack so a tap on a slide's own control is a tap.
        if (Math.abs(px) < 4) return;
        viewport.setAttribute("data-swiping", "");
        viewport.setPointerCapture(event.pointerId);
      }
      applyDrag(px);
    };
    const onPointerUp = (event: React.PointerEvent) => {
      if (!swipe) return;
      endDrag(event);
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
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- WAI-ARIA Carousel pattern: a focusable region with arrow-key navigation (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/). */}
        <div
          style={
            {
              "--fuji-cv-per-base": per.base,
              "--fuji-cv-per-sm": per.sm,
              "--fuji-cv-per-md": per.md,
              "--fuji-cv-per-lg": per.lg,
              "--fuji-cv-count": count,
              "--fuji-cv-duration": transitionDuration
                ? `${transitionDuration}ms`
                : "var(--fuji-duration-slow)",
            } as React.CSSProperties
          }
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
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(event) => endDrag(event, false)}
          onPointerLeave={cancelPress}
          // Native image/link drag fires `dragstart` then `pointercancel` a few px in, killing the
          // swipe. Children can opt back in with their own `draggable`.
          onDragStart={(event) => event.preventDefault()}
          // Coverflow slides snap with a clone reset, or the fan re-animates after every wrap.
          data-resetting={animate ? undefined : ""}
          className={cn(
            "fuji-carousel fj:rounded-fuji-panel fj:outline-none fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring",
            coverflow ? "fuji-coverflow" : "fj:overflow-hidden",
          )}
        >
          <div
            ref={trackRef}
            // Silent while autoplaying (WAI-ARIA carousel pattern: don't interrupt every few
            // seconds); under manual control a slide change is the user's action, so announce it.
            aria-live={autoplay && !manuallyPaused ? "off" : "polite"}
            className="fuji-carousel-track fj:flex fj:touch-pan-y"
            style={{
              transform: `translateX(${translate})`,
              // CSS owns the transition; only clone resets and reduced motion override it.
              transition: animate && !reduceMotion ? undefined : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {rendered.map((child, childIndex) => {
              const realSlide = canLoop ? (((childIndex - cloneCount) % count) + count) % count : childIndex;
              const isClone = canLoop && (childIndex < cloneCount || childIndex >= cloneCount + count);
              return (
                <div
                  key={childIndex}
                  // `inert` set as a DOM property: React 19 treats the JSX prop as strict boolean
                  // ("" is false) and React 18 warns on it; the DOM property works in both.
                  ref={(node) => {
                    if (node) node.inert = isClone;
                  }}
                  role="group"
                  aria-hidden={isClone || undefined}
                  aria-roledescription="slide"
                  aria-label={`Slide ${realSlide + 1} of ${count}`}
                  data-active={coverflow && childIndex === display ? "" : undefined}
                  className={cn(
                    "fj:box-border fj:w-[calc(100%/var(--fuji-cv-per))] fj:shrink-0",
                    coverflow ? "fuji-coverflow-slide fj:relative" : "fj:px-1.5 fj:first:pl-0 fj:last:pr-0",
                  )}
                  style={
                    coverflow
                      ? ({
                          "--fuji-cv-offset": childIndex - display,
                          // Nearer slides stack on top (reference: 1000 - |offset px|).
                          zIndex: 1000 - Math.abs(childIndex - display) * 100,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>

        {controls && count > 1 && (
          <>
            <div className="fj:absolute fj:top-1/2 fj:left-2 fj:z-20 fj:-translate-y-1/2">
              <button
                type="button"
                aria-label="Previous slide"
                disabled={atStart}
                onClick={previous}
                className={cn(NATIVE_CONTROL_RESET, ARROW_CLASSES)}
              >
                <ChevronLeft className="fj:size-5" />
              </button>
            </div>
            <div className="fj:absolute fj:top-1/2 fj:right-2 fj:z-20 fj:-translate-y-1/2">
              <button
                type="button"
                aria-label="Next slide"
                disabled={atEnd}
                onClick={next}
                className={cn(NATIVE_CONTROL_RESET, ARROW_CLASSES)}
              >
                <ChevronRight className="fj:size-5" />
              </button>
            </div>
          </>
        )}

        {autoplay && count > 1 && (
          <div className="fj:absolute fj:top-2 fj:right-2 fj:z-20">
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
                  // The dot is 6px; padding makes the button meet the 24px minimum target.
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:group fj:flex fj:cursor-pointer fj:items-center fj:px-1 fj:py-2.5",
                  )}
                >
                  <span
                    className={cn(
                      "fj:block fj:h-1.5 fj:overflow-hidden fj:rounded-full fj:transition-[width,background-color] fj:duration-[var(--fuji-duration-base)]",
                      isActive
                        ? "fj:w-6 fj:bg-fuji-border-strong"
                        : "fj:w-1.5 fj:bg-fuji-border-strong fj:group-hover:bg-fuji-foreground-subtle",
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
                            : undefined
                        }
                      />
                    )}
                  </span>
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
 * Marquee: a duplicated slide set on a linear infinite keyframe (no JS timers). `count` slide-widths
 * (`-100% / var(--fuji-cv-per)`, as in SteppedCarousel) is one lap, so the duplicate hides the wrap.
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
    // Stepped-only props are accepted (shared prop objects) but stripped so they don't hit the DOM.
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
    delete props.effect;

    const slides = React.Children.toArray(children);
    const count = slides.length;
    const per = React.useMemo(() => resolvePerView(slidesPerView), [slidesPerView]);
    const reduceMotion = usePrefersReducedMotion();
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
        <div
          style={
            {
              "--fuji-cv-per-base": per.base,
              "--fuji-cv-per-sm": per.sm,
              "--fuji-cv-per-md": per.md,
              "--fuji-cv-per-lg": per.lg,
              "--fuji-cv-count": count,
            } as React.CSSProperties
          }
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          className="fuji-carousel fj:overflow-hidden fj:rounded-fuji-panel"
        >
          <div
            className="fj:flex"
            style={
              running
                ? {
                    // Global keyframe in tokens.css; its comment explains why no per-instance name.
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
                  // `inert` as a DOM property for React 18/19 - see SteppedCarousel.
                  ref={(node) => {
                    if (node) node.inert = isClone;
                  }}
                  role="group"
                  aria-hidden={isClone || undefined}
                  aria-roledescription="slide"
                  aria-label={`Slide ${(childIndex % count) + 1} of ${count}`}
                  className="fj:box-border fj:w-[calc(100%/var(--fuji-cv-per))] fj:shrink-0 fj:px-1.5"
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>

        {running && (
          <div className="fj:absolute fj:top-2 fj:right-2 fj:z-20">
            <PlayPauseButton pressed={manuallyPaused} onToggle={() => setManuallyPaused((value) => !value)} />
          </div>
        )}
      </div>
    );
  },
);
