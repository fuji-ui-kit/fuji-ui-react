import type { Meta, StoryObj } from "@storybook/react";
import { PasswordInput } from "@fujiui/react";

const meta = {
  title: "Forms/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Enter your password",
    "aria-label": "Password",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A pre-filled value makes the visibility toggle's effect visible. */
export const WithValue: Story = {
  args: { defaultValue: "correct-horse-battery-staple" },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "short" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "correct-horse-battery-staple" },
};
