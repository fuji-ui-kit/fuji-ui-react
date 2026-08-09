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

// `FileUpload`'s root is a plain `flex flex-col` block - it intentionally sets
// no width of its own, so it fills whatever container a consumer places it
// in (the right default for a form control inside a form layout). Left
// unconstrained in Storybook's wide canvas, that reads as "stretches full
// width" - wrapping the default/representative examples in `inline-block`
// sizes the story to the control's actual content instead. `FullWidth` below
// shows the deliberate opposite, via ordinary composition (a `w-full`
// wrapper), not a new prop.
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

/** Sizing to a container is ordinary composition, not a dedicated prop - wrap it in a `w-full` element. */
export const FullWidth: Story = {
  render: (args) => (
    <div className="w-full">
      <FileUpload {...args} />
    </div>
  ),
};
