import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@fujiui/react";
import { placeholderPhoto } from "../lib/placeholder-image";

const meta = {
  title: "Foundation/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  args: {
    ratio: 16 / 9,
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <AspectRatio {...args} className="rounded-lg bg-fuji-surface-strong">
        <img
          src={placeholderPhoto("mountain-landscape")}
          alt="Mountain landscape"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <AspectRatio ratio={1} className="flex items-center justify-center rounded-lg bg-fuji-surface-strong">
        <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">1 / 1</span>
      </AspectRatio>
    </div>
  ),
};

export const Photo: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <AspectRatio
        ratio={4 / 3}
        className="flex items-center justify-center rounded-lg bg-fuji-surface-strong"
      >
        <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">4 / 3</span>
      </AspectRatio>
    </div>
  ),
};
