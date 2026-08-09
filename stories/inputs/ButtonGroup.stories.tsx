import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Bold, Italic, Underline } from "lucide-react";
import { Button, ButtonGroup, IconButton } from "@fujiui/react";

const meta = {
  title: "Inputs/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button appearance="bordered">Day</Button>
      <Button appearance="bordered">Week</Button>
      <Button appearance="bordered">Month</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <IconButton appearance="bordered" aria-label="Bold">
        <Bold className="size-4" />
      </IconButton>
      <IconButton appearance="bordered" aria-label="Italic">
        <Italic className="size-4" />
      </IconButton>
      <IconButton appearance="bordered" aria-label="Underline">
        <Underline className="size-4" />
      </IconButton>
    </ButtonGroup>
  ),
};

const VIEW_ITEMS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year", disabled: true },
];

function ControlledButtonGroup() {
  const [value, setValue] = React.useState("week");
  return <ButtonGroup items={VIEW_ITEMS} value={value} onValueChange={setValue} />;
}

export const SingleSelection: Story = {
  name: "Single selection (radiogroup)",
  render: () => <ControlledButtonGroup />,
};
