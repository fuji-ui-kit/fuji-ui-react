import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Carousel } from "./Carousel";

// Slides must be direct children: `React.Children.toArray` would count a wrapper as one slide.
function slides(count: number) {
  return Array.from({ length: count }, (_, i) => <div key={i}>Slide {i + 1}</div>);
}

// Navigation moves `display` at once but `active` (the aria-current dot) waits for the track's
// `transitionend`, which jsdom never fires - so simulate it.
function settleTransition(region: HTMLElement) {
  const track = region.firstElementChild as HTMLElement;
  act(() => {
    fireEvent.transitionEnd(track);
    // Flush the loop reset's rAF (a fake timer) inside this `act()` so its state update isn't
    // outside any act scope.
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
    // A native `.focus()` fires `onFocusCapture` (pausing autoplay) outside Testing Library's act.
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

  describe('effect="coverflow"', () => {
    const viewport = (container: HTMLElement) => container.querySelector<HTMLElement>(".fuji-carousel")!;

    it("keeps its 1.6 centre-slide width when slidesPerView is not given", () => {
      const { container } = render(
        <Carousel aria-label="Demo" effect="coverflow">
          {slides(4)}
        </Carousel>,
      );
      expect(viewport(container).style.getPropertyValue("--fuji-cv-per-base")).toBe("1.6");
      expect(viewport(container).style.getPropertyValue("--fuji-cv-per-lg")).toBe("1.6");
    });

    it("honours slidesPerView, including a responsive map", () => {
      const { container } = render(
        <Carousel aria-label="Demo" effect="coverflow" slidesPerView={{ base: 1.2, md: 2.5 }}>
          {slides(5)}
        </Carousel>,
      );
      const style = viewport(container).style;
      expect(style.getPropertyValue("--fuji-cv-per-base")).toBe("1.2");
      expect(style.getPropertyValue("--fuji-cv-per-sm")).toBe("1.2");
      expect(style.getPropertyValue("--fuji-cv-per-md")).toBe("2.5");
      expect(style.getPropertyValue("--fuji-cv-per-lg")).toBe("2.5");
    });

    it("clamps a slidesPerView below 1 to 1", () => {
      const { container } = render(
        <Carousel aria-label="Demo" effect="coverflow" slidesPerView={0.5}>
          {slides(3)}
        </Carousel>,
      );
      expect(viewport(container).style.getPropertyValue("--fuji-cv-per-base")).toBe("1");
    });

    it("lets every slide become active without loop, whatever slidesPerView is", () => {
      render(
        <Carousel aria-label="Demo" effect="coverflow" loop={false} slidesPerView={3} controls>
          {slides(4)}
        </Carousel>,
      );
      // The centred layout has no "final full page", so all four slides get a dot.
      expect(screen.getAllByRole("button", { name: /slide \d/i })).toHaveLength(4);
    });
  });
});
