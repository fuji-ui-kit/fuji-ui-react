import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
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

/** The figure as the digit strips currently show it - what a sighted user reads. */
function shownDigits(container: HTMLElement): string {
  return [...container.querySelectorAll<HTMLElement>(".fuji-digit")]
    .map((cell) =>
      cell.classList.contains("fuji-digit-static")
        ? cell.textContent
        : String(cell.style.getPropertyValue("--fuji-digit")),
    )
    .join("");
}

describe("Statistic", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;

  beforeEach(() => {
    vi.useFakeTimers();
    io = mockIntersectionObserver();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // The markup must say the real number before any animation runs - the
  // previous count-up rendered "0" on the server and in no-JS output.
  it("renders the final value in server markup, one cell per character", () => {
    const html = renderToStaticMarkup(<Statistic label="Revenue" value={1000} prefix="$" />);
    expect(html).toContain('aria-label="$1,000"');
    // Four digit cells rolled to 1,0,0,0 and two static cells ("$" and ",").
    expect(html.match(/--fuji-digit:\s*1\b/g)).toHaveLength(1);
    expect(html.match(/--fuji-digit:\s*0\b/g)).toHaveLength(3);
  });

  it("exposes the full figure to assistive tech as one accessible name", () => {
    render(<Statistic label="Revenue" value={1000} prefix="$" suffix="k" />);
    expect(screen.getByLabelText("$1,000k")).toBeInTheDocument();
  });

  it("rolls each digit strip to its target", () => {
    const { container } = render(<Statistic label="Users" value={1292} />);
    io.reveal();
    expect(shownDigits(container)).toBe("1,292");
  });

  it("flashes the trend colour in the direction of a value change, then clears it", () => {
    function Live({ value }: { value: number }) {
      return <Statistic label="Live" value={value} />;
    }
    const { container, rerender } = render(<Live value={100} />);
    io.reveal();
    const figure = container.querySelector(".fuji-number")!;
    expect(figure).not.toHaveAttribute("data-trend");

    rerender(<Live value={105} />);
    expect(figure).toHaveAttribute("data-trend", "up");
    expect(shownDigits(container)).toBe("105");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(figure).not.toHaveAttribute("data-trend");

    rerender(<Live value={90} />);
    expect(figure).toHaveAttribute("data-trend", "down");
    expect(shownDigits(container)).toBe("90");
  });

  it("respects `decimals`", () => {
    const { container } = render(<Statistic label="Rate" value={4.5} decimals={1} />);
    expect(shownDigits(container)).toBe("4.5");
  });

  it("renders non-numeric values statically without digit cells", () => {
    const { container } = render(<Statistic label="Status" value={<span>Active</span>} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(container.querySelector(".fuji-digit")).toBeNull();
  });

  // Formatting with the runtime's default locale made server and client
  // disagree whenever their locales differed - a hydration mismatch.
  it("formats with a fixed en-US locale by default, whatever the runtime locale is", () => {
    const spy = vi.spyOn(Number.prototype, "toLocaleString");
    render(<Statistic label="Revenue" value={1234.5} decimals={1} />);
    expect(spy).toHaveBeenCalledWith("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    expect(screen.getByLabelText("1,234.5")).toBeInTheDocument();
  });

  it("formats with an explicit locale", () => {
    render(<Statistic label="Umsatz" value={1234.5} decimals={1} locale="de-DE" />);
    expect(screen.getByLabelText("1.234,5")).toBeInTheDocument();
  });

  it("uses formatValue in place of the built-in formatting, rolling its digits", () => {
    const { container } = render(
      <Statistic label="Revenue" value={1500} formatValue={(value) => `${value / 1000}K`} />,
    );
    expect(screen.getByLabelText("1.5K")).toBeInTheDocument();
    expect(shownDigits(container)).toBe("1.5K");
  });
});
