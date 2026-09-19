import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Globe, Maximize2, MoreHorizontal, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { BarChart, DonutChart, IconButton, LineChart } from "@fujiui/react";

const REVENUE_SERIES = [
  {
    name: "This year",
    data: [
      { label: "Jan", value: 42 },
      { label: "Feb", value: 51 },
      { label: "Mar", value: 47 },
      { label: "Apr", value: 63 },
      { label: "May", value: 58 },
      { label: "Jun", value: 71 },
    ],
  },
  {
    name: "Last year",
    data: [
      { label: "Jan", value: 35 },
      { label: "Feb", value: 40 },
      { label: "Mar", value: 38 },
      { label: "Apr", value: 44 },
      { label: "May", value: 49 },
      { label: "Jun", value: 52 },
    ],
  },
];

const TRAFFIC_SOURCES = [
  { label: "Organic search", value: 42 },
  { label: "Direct", value: 27 },
  { label: "Referral", value: 18 },
  { label: "Social", value: 13 },
];

const meta = {
  title: "Data Display/Chart",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  render: () => (
    <LineChart
      title="Monthly revenue"
      description="Thousands of USD, this year vs. last"
      series={REVENUE_SERIES}
      legend
      formatValue={(value) => `$${value}k`}
      className="w-full max-w-xl"
    />
  ),
};

const SALES_7D = [
  {
    name: "Sales",
    color: "var(--fuji-foreground)",
    data: [
      { label: "11 May", value: 1 },
      { label: "12 May", value: 2.4 },
      { label: "13 May", value: 2.1 },
      { label: "14 May", value: 4.6 },
      { label: "15 May", value: 3.9 },
      { label: "16 May", value: 5.4 },
      { label: "17 May", value: 2.8 },
    ],
  },
];

export const DashboardArea: Story = {
  name: "Dashboard area (bold stroke, soft fill)",
  parameters: {
    docs: {
      description: {
        story:
          "The reference dashboard look: one bold foreground-coloured stroke on a smooth monotone curve, a soft gradient under it, no points, and a crosshair that snaps to the nearest day as you move across the plot. The stroke draws itself in on mount.",
      },
    },
  },
  render: () => (
    <LineChart
      title="Sales"
      description="6 items · 11 May 2021 - 18 May 2021"
      series={SALES_7D}
      area
      showPoints={false}
      strokeWidth={4}
      formatValue={(value) => `${value}`}
      className="w-full max-w-xl"
    />
  ),
};

export const Area: Story = {
  name: "Line with area fill",
  parameters: {
    docs: {
      description: {
        story:
          "`area` fills under each line with a fade of its own color. The stroke draws itself in and the fill wipes in behind it; both are pure CSS and collapse to their finished state under `prefers-reduced-motion`.",
      },
    },
  },
  render: () => (
    <LineChart
      title="Monthly revenue"
      description="Thousands of USD"
      series={[REVENUE_SERIES[0]]}
      area
      formatValue={(value) => `$${value}k`}
      className="w-full max-w-xl"
    />
  ),
};

const BALANCE = [
  {
    name: "Balance",
    color: "var(--fuji-default)",
    data: [
      { label: "Jan", value: 9.4 },
      { label: "Feb", value: 12.1 },
      { label: "Mar", value: 10.8 },
      { label: "Apr", value: 17.2 },
      { label: "May", value: 14.6 },
      { label: "Jun", value: 19.75 },
      { label: "Jul", value: 11.3 },
    ],
  },
];

/**
 * Dashboard bar card: `headline` with change pill, muted bars, a `highlight`ed period with value
 * tag, and an `average` line. Bars grow in on mount; hover any bar for its value.
 */
export const Bar: Story = {
  name: "Bar (balance)",
  render: () => (
    <BarChart
      icon={<Wallet />}
      title="Balance"
      actions={
        <>
          <IconButton size="sm" aria-label="Expand">
            <Maximize2 className="size-4" />
          </IconButton>
          <IconButton size="sm" aria-label="More">
            <MoreHorizontal className="size-4" />
          </IconButton>
        </>
      }
      headline={{ value: "$20,245", delta: "12%", deltaTrend: "up", note: "vs last year" }}
      series={BALANCE}
      highlight="Jun"
      average={13.6}
      formatValue={(value) => `$${value.toFixed(1)}k`}
      className="w-full max-w-md"
    />
  ),
};

const PROFIT = [
  {
    name: "Profit",
    color: "var(--fuji-water)",
    data: [
      { label: "Jan", value: 14 },
      { label: "Feb", value: 22 },
      { label: "Mar", value: -9 },
      { label: "Apr", value: 31 },
      { label: "May", value: 18 },
      { label: "Jun", value: -16 },
      { label: "Jul", value: 27 },
      { label: "Aug", value: 35 },
    ],
  },
];

/** Negative values hang below a zero baseline; several periods can be highlighted at once. */
export const BarProfit: Story = {
  name: "Bar (profit over time, negatives)",
  render: () => (
    <BarChart
      icon={<TrendingUp />}
      title="Profit over time"
      headline={{ label: "Total $ profit", value: "$420,110" }}
      series={PROFIT}
      highlight={["Aug", "Jun"]}
      formatValue={(value) => `${value}k`}
      className="w-full max-w-md"
    />
  ),
};

const ANALYTICS = [
  {
    name: "Page views",
    color: "var(--fuji-sun)",
    data: Array.from({ length: 18 }, (_, index) => ({
      label: String(index + 1),
      value: [22, 31, 27, 44, 38, 52, 47, 61, 55, 49, 66, 58, 72, 64, 70, 78, 69, 81][index],
    })),
  },
];

/** A `stats` strip above a denser, fully-coloured series (no `highlight`). */
export const BarAnalytics: Story = {
  name: "Bar (web analytics, stats strip)",
  render: () => (
    <BarChart
      icon={<Globe />}
      title="Web analytics"
      stats={[
        { label: "Visit duration", value: "1m 35s" },
        { label: "Total page views", value: "803k" },
        { label: "Unique visitors", value: "120k" },
      ]}
      series={ANALYTICS}
      formatValue={(value) => `${value}k`}
      className="w-full max-w-md"
    />
  ),
};

/**
 * The ring draws in on mount and casts the theme's shadow (try `floating`). Hover a segment or
 * legend row to thicken it and show its value and share.
 */
export const Donut: Story = {
  render: () => (
    <DonutChart
      title="Traffic sources"
      description="Sessions by channel, last 30 days"
      data={TRAFFIC_SOURCES}
      centerLabel="Sessions"
      className="w-full max-w-[28rem]"
    />
  ),
};

export const LoadingState: Story = {
  name: "Loading",
  render: () => (
    <LineChart title="Monthly revenue" series={REVENUE_SERIES} loading className="w-full max-w-xl" />
  ),
};

export const EmptyState: Story = {
  name: "Empty",
  render: () => <BarChart title="Monthly revenue" series={[]} empty className="w-full max-w-xl" />,
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Hooks live in a component, not in a `render` callback (rules of hooks). */
function AnimatedUpdateDemo() {
  const roll = () => DAYS.map((label) => ({ label, value: 20 + Math.round(Math.random() * 70) }));
  // Fixed seed, not random: a random initial state trips SSR hydration.
  const [data, setData] = React.useState([
    { label: "Mon", value: 84 },
    { label: "Tue", value: 71 },
    { label: "Wed", value: 63 },
    { label: "Thu", value: 31 },
    { label: "Fri", value: 42 },
    { label: "Sat", value: 76 },
    { label: "Sun", value: 58 },
  ]);

  return (
    <LineChart
      title="Weekly signups"
      description="Press the button to re-roll the values and watch the line, its area fill and the axis travel to the new shape."
      series={[{ name: "Signups", data }]}
      area
      actions={
        <IconButton aria-label="Randomise data" onClick={() => setData(roll())}>
          <RefreshCw />
        </IconButton>
      }
    />
  );
}

export const AnimatedUpdate: Story = {
  render: () => <AnimatedUpdateDemo />,
};

export const NarrowContainer: Story = {
  name: "Narrow container (288px) with a locale",
  render: () => (
    <div className="w-72">
      <BarChart
        title="Umsatz"
        locale="de-DE"
        series={[
          {
            name: "Umsatz",
            data: [
              { label: "Q1", value: 12400 },
              { label: "Q2", value: 18250 },
              { label: "Q3", value: 15900 },
            ],
          },
        ]}
      />
    </div>
  ),
};
