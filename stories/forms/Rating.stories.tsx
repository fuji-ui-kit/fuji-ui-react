import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "@fujiui/react";

const meta = {
  title: "Forms/Rating",
  component: Rating,
  tags: ["autodocs"],
  args: {
    label: "Rate this product",
    defaultValue: 3,
    max: 5,
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Rating {...args} size="sm" label="Rate this product (small)" />
      <Rating {...args} size="md" label="Rate this product (medium)" />
      <Rating {...args} size="lg" label="Rate this product (large)" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(["default", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Rating key={tone} {...args} tone={tone} label={`Rate this product (${tone})`} />
      ))}
    </div>
  ),
};

export const TenStars: Story = {
  name: "Custom max (10)",
  args: { max: 10, defaultValue: 7 },
};

/** A read-only rating renders as a static value display, not an input. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 4.5, label: "Average rating" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 2 },
};
