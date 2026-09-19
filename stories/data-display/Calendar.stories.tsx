import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
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

/** `minDate={new Date()}` disables the past but keeps today: bounds compare by calendar day. */
export const NoPastDates: Story = {
  name: "No past dates",
  render: () => <Calendar minDate={new Date()} />,
};

/** `markedDates` dots busy days; `markedDateLabel` is announced with each marked day. */
export const MarkedDates: Story = {
  render: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return (
      <Calendar
        markedDates={[new Date(year, month, 3), new Date(year, month, 12), today, new Date(year, month, 24)]}
        markedDateLabel="has tasks"
      />
    );
  },
};

/** `today` pins the date treated as today - deterministic for SSR, demos, and visual tests. */
export const FixedToday: Story = {
  args: { today: new Date(2024, 4, 15), markedDates: (date: Date) => date.getDay() === 1 },
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
