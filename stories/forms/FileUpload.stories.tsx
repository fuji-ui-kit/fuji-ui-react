import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "@fujiui/react";

const meta = {
  title: "Forms/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  args: {
    label: "Choose file",
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

// `FileUpload` sets no width and fills its container, so `inline-block` sizes these stories to
// content on the wide canvas. `FullWidth` shows the opposite with a `w-full` wrapper, not a prop.
export const Default: Story = {
  render: (args) => (
    <div className="inline-block">
      <FileUpload {...args} />
    </div>
  ),
};

export const Multiple: Story = {
  args: { multiple: true, label: "Choose files" },
  render: (args) => (
    <div className="inline-block">
      <FileUpload {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="inline-block">
      <FileUpload {...args} />
    </div>
  ),
};

/** Filling a container is plain composition, not a prop: wrap it in a `w-full` element. */
export const FullWidth: Story = {
  render: (args) => (
    <div className="w-full">
      <FileUpload {...args} />
    </div>
  ),
};
