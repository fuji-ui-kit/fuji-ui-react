import type { Meta, StoryObj } from "@storybook/react";
import { BarChart, DonutChart, LineChart } from "@fujiui/react";

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

export const Bar: Story = {
  render: () => (
    <BarChart
      title="Monthly revenue"
      series={[REVENUE_SERIES[0]]}
      formatValue={(value) => `$${value}k`}
      className="w-full max-w-xl"
    />
  ),
};

export const Donut: Story = {
  render: () => (
    <DonutChart
      title="Traffic sources"
      data={TRAFFIC_SOURCES}
      centerLabel="Sessions"
      legend
      className="w-full max-w-[26rem]"
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
