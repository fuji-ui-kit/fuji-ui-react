import type { Meta, StoryObj } from "@storybook/react";
import { Statistic } from "@fujiui/react";

const meta = {
  title: "Data Display/Statistic",
  component: Statistic,
  tags: ["autodocs"],
  args: {
    label: "Monthly active users",
    value: 48213,
  },
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

// Statistic count-up plays once the element scrolls into view - the preview
// canvas is already in view on mount, so it animates immediately here.
export const Default: Story = {};

export const WithTrend: Story = {
  args: { trend: 12.4, trendLabel: "vs. last month" },
};

export const NegativeTrend: Story = {
  name: "With negative trend",
  args: { label: "Churned accounts", value: 214, trend: -8.1, trendLabel: "vs. last month" },
};

export const WithPrefixSuffix: Story = {
  name: "With prefix/suffix",
  args: { label: "Monthly recurring revenue", value: 92400, prefix: "$", decimals: 0 },
};

export const Row: Story = {
  name: "Row of statistics",
  render: () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
      <Statistic label="Revenue" value={92400} prefix="$" trend={4.2} trendLabel="MoM" />
      <Statistic label="Active users" value={48213} trend={12.4} trendLabel="MoM" />
      <Statistic label="Churn" value={214} trend={-8.1} trendLabel="MoM" />
    </div>
  ),
};

export const AsCard: Story = {
  name: "As a card (`card`)",
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Statistic card label="Revenue" value={92400} prefix="$" trend={4.2} trendLabel="MoM" />
      <Statistic card label="Active users" value={48213} trend={12.4} trendLabel="MoM" />
      <Statistic card label="Churn" value={214} trend={-8.1} trendLabel="MoM" />
    </div>
  ),
};

export const LocaleAndFormat: Story = {
  name: "Locale and custom formatting",
  render: () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
      <Statistic label="Default (en-US)" value={1234567.8} decimals={1} />
      <Statistic label='locale="de-DE"' value={1234567.8} decimals={1} locale="de-DE" />
      <Statistic
        label="formatValue (compact)"
        value={1234567}
        formatValue={(value) =>
          new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
        }
      />
    </div>
  ),
};
