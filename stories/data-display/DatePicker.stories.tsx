import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { DatePicker, FormField } from "@fujiui/react";

const meta = {
  title: "Data Display/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  args: {
    "aria-label": "Date",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <DatePicker {...args} size="sm" />
      <DatePicker {...args} size="md" />
      <DatePicker {...args} size="lg" />
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};

/** Label, description and invalid state come from the surrounding FormField, not the picker. */
export const InFormField: Story = {
  name: "In a FormField",
  render: () => (
    <div className="w-72">
      <FormField invalid>
        <FormField.Label>Due date</FormField.Label>
        <DatePicker minDate={new Date()} />
        <FormField.Error>Pick a due date.</FormField.Error>
      </FormField>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Uncontrolled: Story = {
  args: { defaultValue: new Date() },
};

function ControlledDatePicker() {
  const [value, setValue] = React.useState<Date | null>(new Date());
  return (
    <div className="flex flex-col gap-2">
      <DatePicker aria-label="Date" value={value} onChange={setValue} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        {value ? value.toLocaleDateString() : "No date selected"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDatePicker />,
};

/** Static header (default) - prev/next arrows only, no month/year chooser. */
export const StaticHeader: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Date" }));
  },
};

/** Clicking the month/year label opens a month grid and year list for long-range navigation. */
export const SelectableHeader: Story = {
  args: { interactiveHeader: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Date" }));
  },
};

export const OpensOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Date" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};
