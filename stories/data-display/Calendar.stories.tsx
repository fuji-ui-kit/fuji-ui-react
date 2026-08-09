import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Calendar } from "@fujiui/react";

const meta = {
  title: "Data Display/Calendar",
  component: Calendar,
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InteractiveHeader: Story = {
  args: { interactiveHeader: true },
};

export const WithBounds: Story = {
  name: "With min/max date",
  render: () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return <Calendar minDate={minDate} maxDate={maxDate} />;
  },
};

function ControlledCalendar() {
  const [date, setDate] = React.useState<Date | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Calendar value={date} onChange={setDate} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        {date ? date.toLocaleDateString() : "No date selected"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledCalendar />,
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("grid");
    const activeCell = grid.querySelector('[tabindex="0"]') as HTMLElement;
    activeCell.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(grid.querySelector('[tabindex="0"]')).toHaveFocus();
  },
};
