import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Carousel } from "./Carousel";

// `React.Children.toArray` reads Carousel's JSX children as authored, so the
// slides must be passed as direct children - a wrapper component here would
// collapse to a single child element instead of N slides.
function slides(count: number) {
  return Array.from({ length: count }, (_, i) => <div key={i}>Slide {i + 1}</div>);
}

// next()/previous()/autoplay move `display` right away (the CSS transform
// starts sliding), but `active` (and therefore which dot is aria-current)
// only updates once the real browser fires `transitionend` on the track -
// jsdom never runs the animation or fires that event on its own, so tests
// exercising arrow/autoplay navigation simulate the browser finishing it.
function settleTransition(region: HTMLElement) {
  const track = region.firstElementChild as HTMLElement;
  act(() => {
    fireEvent.transitionEnd(track);
    // A loop-boundary reset also schedules a `requestAnimationFrame` (to
    // re-enable animation on the next frame - see Carousel.tsx) which fake
    // timers turn into a pending timer; flushing it inside the same `act()`
    // keeps that follow-up state update from firing outside any act scope.
    vi.advanceTimersByTime(0);
  });
}

describe("Carousel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves the track when clicking an indicator dot, even with loop enabled (default)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <Carousel aria-label="Demo" autoplay={false}>
        {slides(5)}
      </Carousel>,
    );

    const dots = screen.getAllByRole("button", { name: /Go to slide/ });
    expect(dots).toHaveLength(5);

    await user.click(dots[3]);

    expect(dots[3]).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Slide 4 of 5")).not.toHaveAttribute("aria-hidden");
  });

  it("supports keyboard arrow navigation on the region", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <Carousel aria-label="Demo" autoplay={false}>
        {slides(3)}
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Demo" });
    // A plain DOM `.focus()` call fires React's `onFocusCapture` (which pauses
    // autoplay) outside of Testing Library's own act-wrapped event helpers -
    // unlike `fireEvent`/`user-event`, nothing wraps a direct native API call
    // for you.
    act(() => region.focus());
    await user.keyboard("{ArrowRight}");
    settleTransition(region);
    expect(screen.getAllByRole("button", { name: /Go to slide/ })[1]).toHaveAttribute("aria-current", "true");
  });

  it("autoplays on an interval and pauses on hover, resuming on mouse leave", async () => {
    render(
      <Carousel aria-label="Demo" autoplay autoplayInterval={1000}>
        {slides(3)}
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Demo" });
    const dots = () => screen.getAllByRole("button", { name: /Go to slide/ });

    expect(dots()[0]).toHaveAttribute("aria-current", "true");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    settleTransition(region);
    expect(dots()[1]).toHaveAttribute("aria-current", "true");

    // Hovering the wrapper (region's parent) pauses autoplay.
    const wrapper = region.parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(dots()[1]).toHaveAttribute("aria-current", "true");

    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    settleTransition(region);
    expect(dots()[2]).toHaveAttribute("aria-current", "true");
  });

  it("clears the autoplay interval on unmount (no timer leak)", () => {
    const clearSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(
      <Carousel aria-label="Demo" autoplay autoplayInterval={1000}>
        {slides(3)}
      </Carousel>,
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("respects prefers-reduced-motion by disabling autoplay", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    render(
      <Carousel aria-label="Demo" autoplay autoplayInterval={1000}>
        {slides(3)}
      </Carousel>,
    );
    const dots = () => screen.getAllByRole("button", { name: /Go to slide/ });
    vi.advanceTimersByTime(5000);
    expect(dots()[0]).toHaveAttribute("aria-current", "true");

    window.matchMedia = originalMatchMedia;
  });
});
