import type { Meta, StoryObj } from "@storybook/react";
import { Image } from "@fuji-ui/react";
import { placeholderPhoto } from "../lib/placeholder-image";

const meta = {
  title: "Data Display/Image",
  component: Image,
  tags: ["autodocs"],
  args: {
    src: placeholderPhoto("mountain-sunrise"),
    alt: "Mountain landscape at sunrise",
    ratio: 16 / 9,
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Image {...args} />
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error (broken source)",
  args: { src: "https://example.com/does-not-exist.png" },
  render: (args) => (
    <div className="w-full max-w-md">
      <Image {...args} />
    </div>
  ),
};

export const Fullscreen: Story = {
  name: "Fullscreen preview",
  args: { fullscreen: true },
  render: (args) => (
    <div className="w-full max-w-md">
      <Image {...args} />
    </div>
  ),
};

export const WithoutLoadingSkeleton: Story = {
  name: "Without loading skeleton",
  args: { showLoadingSkeleton: false },
  render: (args) => (
    <div className="w-full max-w-md">
      <Image {...args} />
    </div>
  ),
};
