import type { Meta, StoryObj } from "@storybook/react";
import type { SegmentedControlOption } from "@fujiui/react";
import { SegmentedControl } from "@fujiui/react";

const VIEW_OPTIONS: SegmentedControlOption[] = [
  { label: "List", value: "list" },
  { label: "Board", value: "board" },
  { label: "Calendar", value: "calendar" },
];

const meta = {
  title: "Forms/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  args: {
    options: VIEW_OPTIONS,
    defaultValue: "list",
    "aria-label": "View",
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { label: "List", value: "list" },
      { label: "Board", value: "board" },
      { label: "Calendar", value: "calendar", disabled: true },
    ],
  },
};
