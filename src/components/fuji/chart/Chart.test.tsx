import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BarChart, DonutChart, LineChart } from "./Chart";

const WEEK = ["Mon", "Tue", "Wed"];
const seriesOf = (values: number[]) => [
  { name: "Signups", data: WEEK.map((label, index) => ({ label, value: values[index] })) },
];

function linePath(container: HTMLElement) {
  return container.querySelector(".fuji-chart-line")?.getAttribute("d") ?? "";
}

describe("Chart data updates", () => {
  it("travels to new line data instead of snapping to it", async () => {
    const { container, rerender } = render(<LineChart title="Signups" series={seriesOf([10, 20, 30])} />);
    const before = linePath(container);

    rerender(<LineChart title="Signups" series={seriesOf([90, 40, 5])} />);
    // The next frame is still the old shape: snapping is the bug this covers.
    expect(linePath(container)).toBe(before);

    await waitFor(() => expect(linePath(container)).not.toBe(before));
    // ...and arrives exactly. Generous timeout: jsdom throttles real frames under load.
    const target = render(<LineChart title="Signups" series={seriesOf([90, 40, 5])} />);
    await waitFor(() => expect(linePath(container)).toBe(linePath(target.container)), {
      timeout: 4000,
    });
  }, 10_000);

  it("keeps the accessible data table on the real values while it animates", () => {
    const { rerender } = render(<LineChart title="Signups" series={seriesOf([10, 20, 30])} />);
    rerender(<LineChart title="Signups" series={seriesOf([90, 40, 5])} />);
    // Assistive technology reads the data, never the frames in between.
    expect(screen.getByRole("row", { name: /Signups, Mon/ })).toHaveTextContent("90");
  });

  it("does not restart on a new array holding the same values", async () => {
    const { container, rerender } = render(<LineChart title="Signups" series={seriesOf([10, 20, 30])} />);
    const before = linePath(container);
    // Consumers routinely pass an inline array, so identity is not change.
    rerender(<LineChart title="Signups" series={seriesOf([10, 20, 30])} />);
    await waitFor(() => expect(linePath(container)).toBe(before));
  });

  it("snaps when the shape changes, since there are no points to pair up", () => {
    const { container, rerender } = render(<LineChart title="Signups" series={seriesOf([10, 20, 30])} />);
    const before = linePath(container);
    rerender(<LineChart title="Signups" series={[{ name: "Signups", data: [{ label: "Q1", value: 4 }] }]} />);
    expect(linePath(container)).not.toBe(before);
  });

  it("animates bar geometry", async () => {
    const heights = (container: HTMLElement) =>
      Array.from(container.querySelectorAll(".fuji-chart-bar")).map((bar) => bar.getAttribute("height"));
    const { container, rerender } = render(<BarChart title="Signups" series={seriesOf([10, 20, 30])} />);
    const before = heights(container);
    rerender(<BarChart title="Signups" series={seriesOf([90, 40, 5])} />);
    expect(heights(container)).toEqual(before);
    await waitFor(() => expect(heights(container)).not.toEqual(before));
  });

  it("animates the donut's segments and its visible figures", async () => {
    const { container, rerender } = render(
      <DonutChart
        title="Split"
        data={[
          { label: "A", value: 30 },
          { label: "B", value: 70 },
        ]}
      />,
    );
    const dash = () => container.querySelector(".fuji-chart-segment")?.getAttribute("stroke-dasharray");
    const before = dash();
    rerender(
      <DonutChart
        title="Split"
        data={[
          { label: "A", value: 80 },
          { label: "B", value: 20 },
        ]}
      />,
    );
    expect(dash()).toBe(before);
    await waitFor(() => expect(dash()).not.toBe(before));
  });

  it("never prints a fractional figure while a whole number travels", async () => {
    const { rerender } = render(
      <DonutChart
        title="Split"
        data={[
          { label: "A", value: 30 },
          { label: "B", value: 70 },
        ]}
      />,
    );
    const seen: string[] = [];
    rerender(
      <DonutChart
        title="Split"
        data={[
          { label: "A", value: 80 },
          { label: "B", value: 20 },
        ]}
      />,
    );
    await waitFor(() => {
      // The legend prints the interpolated value, so it has to stay a counter.
      const cells = screen.getAllByText(/^\d+(\.\d+)?$/).map((node) => node.textContent ?? "");
      seen.push(...cells);
      expect(seen).toContain("80");
    });
    expect(seen.filter((text) => text.includes("."))).toEqual([]);
  });
});

describe("Chart formatting and sizing", () => {
  const big = [{ name: "Revenue", data: [{ label: "Q1", value: 1234567 }] }];

  it("formats figures with a fixed en-US locale by default, not the runtime's", () => {
    const spy = vi.spyOn(Number.prototype, "toLocaleString");
    render(<BarChart title="Revenue" series={big} />);
    expect(spy).toHaveBeenCalled();
    for (const call of spy.mock.calls) expect(call[0]).toBe("en-US");
    spy.mockRestore();
    expect(screen.getAllByText("1,234,567").length).toBeGreaterThan(0);
  });

  it("formats with an explicit locale", () => {
    render(<LineChart title="Umsatz" series={big} locale="de-DE" />);
    expect(screen.getAllByText("1.234.567").length).toBeGreaterThan(0);
  });

  it("prefers formatValue over locale", () => {
    render(<DonutChart title="Split" data={big[0].data} locale="de-DE" formatValue={(v) => `$${v}`} />);
    expect(screen.getAllByText("$1234567").length).toBeGreaterThan(0);
  });

  it("does not leak locale onto the DOM", () => {
    const { container } = render(<LineChart title="Revenue" series={big} locale="de-DE" />);
    expect(container.querySelector("[locale]")).toBeNull();
  });

  // A fixed 380px minimum overran cards on 320-375px screens.
  it("lets line and bar plots shrink below 380px", () => {
    for (const Chart of [LineChart, BarChart]) {
      const { container, unmount } = render(<Chart title="Revenue" series={big} />);
      const svg = container.querySelector("svg[role='img']")!;
      expect(svg.getAttribute("class")).not.toMatch(/min-w-\[/);
      expect(svg.getAttribute("class")).toContain("fj:min-w-0");
      unmount();
    }
  });
});
