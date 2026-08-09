import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TimePicker } from "@fujiui/react";

const meta = {
  title: "Forms/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  args: {
    "aria-label": "Select time",
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwelveHour: Story = {
  name: "12-hour format",
  args: { hourCycle: 12, defaultValue: "14:30" },
};

export const TwentyFourHour: Story = {
  name: "24-hour format",
  args: { hourCycle: 24, defaultValue: "14:30" },
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "09:00" },
};

function ControlledTimePicker() {
  const [value, setValue] = React.useState<string | undefined>("09:00");
  return (
    <div className="flex flex-col gap-2">
      <TimePicker aria-label="Meeting time" value={value} onChange={setValue} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Value: {value || "(none)"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTimePicker />,
};
