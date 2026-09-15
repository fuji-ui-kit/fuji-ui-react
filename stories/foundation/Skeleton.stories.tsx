import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@fujiui/react";

const meta = {
  title: "Foundation/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: {
    shape: "block",
  },
  argTypes: {
    shape: { control: "select", options: ["text", "block", "circle"] },
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
      <Skeleton shape="text" className="w-full" />
      <Skeleton shape="text" className="w-full" />
      <Skeleton shape="text" className="w-2/3" />
    </div>
  ),
};

export const AvatarWithText: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton shape="text" className="w-1/2" />
        <Skeleton shape="text" className="w-1/3" />
      </div>
    </div>
  ),
};

export const CardBlock: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Skeleton shape="block" className="h-32 w-full" />
      <Skeleton shape="text" className="w-full" />
      <Skeleton shape="text" className="w-2/3" />
    </div>
  ),
};
