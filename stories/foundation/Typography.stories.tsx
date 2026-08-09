import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "@fujiui/react";

const meta = {
  title: "Foundation/Typography",
  component: Typography,
  tags: ["autodocs"],
  args: {
    variant: "body",
    children: "The quick brown fox jumps over the lazy dog.",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["display", "heading", "title", "subtitle", "body", "bodySm", "caption"],
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Typography variant="display">Display heading</Typography>
      <Typography variant="heading">Section heading</Typography>
      <Typography variant="title">Card title</Typography>
      <Typography variant="subtitle">Supporting subtitle text</Typography>
      <Typography variant="body">
        Body copy for regular paragraphs and longer-form reading content.
      </Typography>
      <Typography variant="bodySm">Smaller body copy, often used for secondary details.</Typography>
      <Typography variant="caption">Caption text for footnotes and metadata.</Typography>
    </div>
  ),
};

export const CustomTag: Story = {
  name: "as (override rendered tag)",
  args: {
    variant: "title",
    as: "div",
    children: "Renders as a <div> instead of an <h3>",
  },
};
