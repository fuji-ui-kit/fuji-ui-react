import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OTPInput } from "@fujiui/react";

const meta = {
  title: "Forms/OTPInput",
  component: OTPInput,
  tags: ["autodocs"],
  args: {
    length: 6,
    size: "md",
    "aria-label": "One-time code",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof OTPInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FourDigits: Story = {
  name: "4-digit code",
  args: { length: 4 },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "123" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "123456" },
};

function ControlledOTPInput() {
  const [value, setValue] = React.useState("");
  return (
    <div className="flex flex-col gap-2">
      <OTPInput length={6} aria-label="One-time code" value={value} onValueChange={setValue} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Value: {value || "(empty)"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledOTPInput />,
};
