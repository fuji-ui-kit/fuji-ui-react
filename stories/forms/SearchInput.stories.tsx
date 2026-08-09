import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "@fuji-ui/react";

const meta = {
  title: "Forms/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Search…",
    "aria-label": "Search",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A non-empty value renders the built-in clear button. */
export const WithValue: Story = {
  args: { defaultValue: "espresso machine" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "espresso machine" },
};
