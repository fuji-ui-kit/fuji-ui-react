import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "@fujiui/react";

const meta = {
  title: "Foundation/Typography",
  component: Typography,
  tags: ["autodocs"],
  args: {
    scale: "body",
    children: "The quick brown fox jumps over the lazy dog.",
  },
  argTypes: {
    scale: {
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
      <Typography scale="display">Display heading</Typography>
      <Typography scale="heading">Section heading</Typography>
      <Typography scale="title">Card title</Typography>
      <Typography scale="subtitle">Supporting subtitle text</Typography>
      <Typography scale="body">Body copy for regular paragraphs and longer-form reading content.</Typography>
      <Typography scale="bodySm">Smaller body copy, often used for secondary details.</Typography>
      <Typography scale="caption">Caption text for footnotes and metadata.</Typography>
    </div>
  ),
};

export const CustomTag: Story = {
  name: "as (override rendered tag)",
  args: {
    scale: "title",
    as: "div",
    children: "Renders as a <div> instead of an <h3>",
  },
};
