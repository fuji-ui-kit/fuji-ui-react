import * as React from "react";
import { describe, expect, it } from "vitest";
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
    // The frame right after the change is still the old shape - that is the
    // whole point. Snapping here is the bug this covers.
    expect(linePath(container)).toBe(before);

    await waitFor(() => expect(linePath(container)).not.toBe(before));
    // ...and it arrives exactly, not approximately: the last frame is the data
    // itself. Generous timeout - this waits on real animation frames, which
    // jsdom throttles under a loaded suite.
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
