import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { Statistic } from "./Statistic";

function mockIntersectionObserver() {
  const instances: Array<{ callback: IntersectionObserverCallback }> = [];
  class MockObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push(this as unknown as { callback: IntersectionObserverCallback });
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error - test polyfill
  window.IntersectionObserver = MockObserver;
  return {
    reveal() {
      act(() => {
        for (const instance of instances) {
          instance.callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            instance as unknown as IntersectionObserver,
          );
        }
      });
    },
  };
}

// The count-up ticks via requestAnimationFrame + performance.now(), so both
// need to be faked (alongside the timer queue) for `advanceTimersByTime` to
// actually drive the animation deterministically.
const FAKE_TIMER_APIS = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "Date",
  "performance",
] as const;

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Statistic", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: [...FAKE_TIMER_APIS] });
    io = mockIntersectionObserver();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts up to the target once the value scrolls into view", () => {
    render(<Statistic label="Revenue" value={1000} />);
    io.reveal();
    advance(700);
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("jumps straight to the target under prefers-reduced-motion (no animation)", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    render(<Statistic label="Revenue" value={42} />);
    io.reveal();
    expect(screen.getByText("42")).toBeInTheDocument();

    window.matchMedia = originalMatchMedia;
  });

  it("animates a later value change from the currently displayed number, not from 0", () => {
    function Live({ value }: { value: number }) {
      return <Statistic label="Live count" value={value} />;
    }
    const { rerender } = render(<Live value={100} />);
    io.reveal();
    advance(700);
    expect(screen.getByText("100")).toBeInTheDocument();

    rerender(<Live value={105} />);
    // Immediately after the value changes, mid-animation, the display must
    // never have reset to 0 - it should be somewhere between 100 and 105.
    advance(1);
    const mid = Number(screen.getByText(/^[\d,.]+$/).textContent!.replace(/,/g, ""));
    expect(mid).toBeGreaterThanOrEqual(100);
    expect(mid).toBeLessThanOrEqual(105);

    advance(700);
    expect(screen.getByText("105")).toBeInTheDocument();
  });

  it("renders non-numeric values statically without animating", () => {
    render(<Statistic label="Status" value={<span>Active</span>} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
