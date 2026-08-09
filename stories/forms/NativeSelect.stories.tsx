import type { Meta, StoryObj } from "@storybook/react";
import { NativeSelect } from "@fuji-ui/react";

const meta = {
  title: "Forms/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  args: {
    size: "md",
    "aria-label": "Country",
    defaultValue: "us",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <NativeSelect {...args}>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="mx">Mexico</option>
      <option value="jp">Japan</option>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <NativeSelect key={size} {...args} size={size}>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
          <option value="jp">Japan</option>
        </NativeSelect>
      ))}
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
