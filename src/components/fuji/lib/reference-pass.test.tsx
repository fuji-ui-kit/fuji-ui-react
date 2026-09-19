import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { FujiProvider } from "../../../provider";
import { Stepper } from "../stepper/Stepper";
import { Timeline } from "../timeline/Timeline";
import { Notification } from "../notification/Notification";
import { Progress } from "../progress/Progress";
import { CircularProgress } from "../circular-progress/CircularProgress";
import { ToastProvider, Toaster } from "../toast/Toast";
import { BarChart } from "../chart/Chart";

/**
 * Consumer-visible contracts from the reference-design pass (motion.dev stack/coverflow/progress,
 * dashboard bar card, history timeline, activity inbox, glass tint).
 */
describe("glass material", () => {
  // Glass has no tint axis: it inherits the active `theme`. A mismatched backdrop takes a nested
  // `theme` provider, not a fourth axis (SPEC.md, docs/theming.md).
  it("inherits the active theme instead of carrying its own tint attribute", () => {
    const dark = render(
      <FujiProvider theme="dark" material="glass">
        <span />
      </FujiProvider>,
    );
    expect(dark.container.firstElementChild).toHaveAttribute("data-fuji-theme", "dark");
    expect(dark.container.firstElementChild).not.toHaveAttribute("data-fuji-glass");

    const light = render(
      <FujiProvider theme="light" material="glass">
        <span />
      </FujiProvider>,
    );
    expect(light.container.firstElementChild).toHaveAttribute("data-fuji-theme", "light");
    expect(light.container.firstElementChild).not.toHaveAttribute("data-fuji-glass");
  });
});

describe("Stepper", () => {
  const steps = [{ label: "One" }, { label: "Two" }, { label: "Three", disabled: true }, { label: "Four" }];

  it("fills every connector up to the current step completely", () => {
    const { container } = render(<Stepper steps={steps} activeStep={2} />);
    const fills = Array.from(container.querySelectorAll<HTMLElement>(".fuji-stepper-fill")).map((node) =>
      node.style.getPropertyValue("--fuji-progress"),
    );
    expect(fills).toEqual(["1", "1", "0"]);
  });

  it("renders a disabled step as a disabled button that ignores clicks", async () => {
    const user = userEvent.setup();
    let clicked: number | null = null;
    render(<Stepper steps={steps} activeStep={0} onStepClick={(index) => (clicked = index)} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[2]).toBeDisabled();
    await user.click(buttons[2]);
    expect(clicked).toBeNull();
    await user.click(buttons[3]);
    expect(clicked).toBe(3);
  });
});

describe("Timeline groups", () => {
  it("renders one list item per group, its heading, media and dated entries", async () => {
    const { container } = render(
      <Timeline
        groups={[
          {
            label: "2017",
            media: <img alt="Plant" src="data:," />,
            items: [{ timestamp: "06", title: "Second phase completed" }],
          },
          { label: "2016", items: [{ timestamp: "12", title: "Product of the year" }] },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "2017" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Plant" })).toBeInTheDocument();
    expect(screen.getByText("Second phase completed")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Notification", () => {
  it("runs the title into the description and timestamp in the inline layout", () => {
    render(<Notification layout="inline" title="Ava" description="liked your post" timestamp="2 h" unread />);
    const row = screen.getByText("Ava").closest("p");
    expect(row).toHaveTextContent("Ava liked your post · 2 h");
    expect(screen.getByText("Unread")).toBeInTheDocument();
  });

  it("wraps a long stacked title instead of truncating it", () => {
    render(<Notification title="A very long notification title that should wrap" />);
    expect(screen.getByText(/A very long/).className).not.toMatch(/truncate/);
  });
});

describe("Progress fills", () => {
  it("drives the linear fill through a 0-1 custom property (scaleX, not width)", () => {
    const { container } = render(<Progress value={40} />);
    const fill = container.querySelector<HTMLElement>(".fuji-progress-fill");
    expect(fill?.style.getPropertyValue("--fuji-progress")).toBe("0.4");
    expect(fill?.style.width).toBe("");
  });

  it("sizes the ring from a numeric diameter and a tenth-of-diameter stroke", () => {
    const { container } = render(<CircularProgress value={69} size={220} showValue />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("stroke-width", "22");
    expect(
      container.querySelector<HTMLElement>(".fuji-ring-fill")?.style.getPropertyValue("--fuji-progress"),
    ).toBe("0.69");
    expect(screen.getByText("69%")).toBeInTheDocument();
  });
});

describe("Toaster", () => {
  it("positions the stack from the bottom centre on request", () => {
    render(
      <ToastProvider>
        <Toaster position="bottom-center" />
      </ToastProvider>,
    );
    const viewport = document.querySelector(".fuji-toast-viewport");
    expect(viewport?.className).toMatch(/left-1\/2/);
    expect(viewport?.className).not.toMatch(/right-4/);
  });
});

describe("BarChart", () => {
  const series = [
    {
      name: "Balance",
      data: [
        { label: "Jan", value: 4 },
        { label: "Feb", value: -2 },
        { label: "Mar", value: 6 },
      ],
    },
  ];

  it("tags the highlighted bar with its value and mutes the rest", () => {
    const { container } = render(
      <BarChart series={series} highlight="Mar" formatValue={(value) => `${value}k`} average={3} />,
    );
    const bars = Array.from(container.querySelectorAll<SVGRectElement>("rect.fuji-chart-bar"));
    expect(bars).toHaveLength(3);
    expect(bars[2].getAttribute("fill")).not.toBe("var(--fuji-border-strong)");
    expect(bars[0].getAttribute("fill")).toBe("var(--fuji-border-strong)");
    expect(screen.getAllByText("6k").length).toBeGreaterThan(0);
    expect(screen.getByText("Avg 3k")).toBeInTheDocument();
  });

  it("renders the headline figure with its change pill and the stats strip", () => {
    render(
      <BarChart
        series={series}
        headline={{ value: "$20,245", delta: "12%", deltaTrend: "up", note: "vs last year" }}
        stats={[{ label: "Visit duration", value: "1m 35s" }]}
      />,
    );
    expect(screen.getByText("$20,245")).toBeInTheDocument();
    expect(screen.getByText("Up")).toBeInTheDocument();
    expect(screen.getByText("1m 35s")).toBeInTheDocument();
  });
});
