import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "@fujiui/react";

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: "email",
    "aria-label": "Notification preference",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroup.Item value="email" label="Email" />
      <RadioGroup.Item value="sms" label="SMS" />
      <RadioGroup.Item value="push" label="Push notification" />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

function ControlledRadioGroup() {
  const [value, setValue] = React.useState("email");
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label="Notification preference"
        value={value}
        onValueChange={(next) => setValue(next as string)}
      >
        <RadioGroup.Item value="email" label="Email" />
        <RadioGroup.Item value="sms" label="SMS" />
        <RadioGroup.Item value="push" label="Push notification" />
      </RadioGroup>
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Selected: {value}</p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledRadioGroup />,
};
