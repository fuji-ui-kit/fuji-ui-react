import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@fujiui/react";

const meta = {
  title: "Foundation/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: {
    variant: "block",
  },
  argTypes: {
    variant: { control: "select", options: ["text", "block", "circle"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Skeleton {...args} className="h-24 w-full max-w-sm" />,
};

export const TextLines: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  ),
};

export const AvatarWithText: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Skeleton variant="circle" className="size-10" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
  ),
};

export const CardBlock: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Skeleton variant="block" className="h-32 w-full" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  ),
};
