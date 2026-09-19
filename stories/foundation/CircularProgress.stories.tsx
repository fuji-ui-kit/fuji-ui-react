import type { Meta, StoryObj } from "@storybook/react";
import { CircularProgress } from "@fujiui/react";

const meta = {
  title: "Foundation/CircularProgress",
  component: CircularProgress,
  tags: ["autodocs"],
  args: {
    value: 65,
    size: "md",
    variant: "default",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof CircularProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValueLabel: Story = {
  args: { showValue: true },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <CircularProgress {...args} size="sm" />
      <CircularProgress {...args} size="md" />
      <CircularProgress {...args} size="lg" />
    </div>
  ),
};

/**
 * Numeric `size` is the px diameter; stroke is a tenth of it (`thickness` overrides) and the label
 * scales along. The arc draws in on mount.
 */
export const Rings: Story = {
  name: "Rings (reference sizes)",
  render: () => (
    <div className="flex items-end gap-10">
      <CircularProgress value={20} size={48} thickness={3} label="Storage" />
      <CircularProgress value={29} size={120} thickness={6} showValue label="Uploads" />
      <CircularProgress value={69} size={220} thickness={14} showValue label="Completion" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: undefined },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "success", "warning", "danger", "info"] as const).map((variant) => (
        <CircularProgress key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
