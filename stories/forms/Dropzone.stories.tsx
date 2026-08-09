import type { Meta, StoryObj } from "@storybook/react";
import { Dropzone } from "@fujiui/react";

const meta = {
  title: "Forms/Dropzone",
  component: Dropzone,
  tags: ["autodocs"],
  args: {
    description: "Drag and drop files here, or click to browse",
  },
} satisfies Meta<typeof Dropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Dropzone {...args} />
    </div>
  ),
};

export const AcceptImagesOnly: Story = {
  name: "Accept images only, multiple",
  render: (args) => (
    <div className="w-full max-w-md">
      <Dropzone
        {...args}
        accept="image/*"
        multiple
        description="Drag and drop images here, or click to browse"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Dropzone {...args} disabled />
    </div>
  ),
};
