import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "@fujiui/react";

const meta = {
  title: "Forms/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    label: "Volume",
    showValue: true,
    defaultValue: 40,
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <Slider {...args} />
    </div>
  ),
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "earth", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: { label: "Price range", defaultValue: [20, 80] },
};

export const SteppedMinMax: Story = {
  name: "Min/max/step",
  args: { label: "Rating", min: 0, max: 10, step: 0.5, defaultValue: 6.5 },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Tones: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {(["default", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Slider key={tone} tone={tone} label={tone} showValue defaultValue={60} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Slider key={size} size={size} label={`Size ${size}`} showValue defaultValue={60} />
      ))}
    </div>
  ),
};
