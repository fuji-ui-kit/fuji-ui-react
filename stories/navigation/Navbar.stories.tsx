import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Navbar } from "@fujiui/react";

const ITEMS = [
  { label: "Overview", href: "#overview", active: true },
  { label: "Components", href: "#components" },
  { label: "Documentation", href: "#docs" },
];

const meta = {
  title: "Navigation/Navbar",
  component: Navbar,
  tags: ["autodocs"],
  args: { items: ITEMS },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function NavbarWithButtonItems() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  return (
    <Navbar
      items={ITEMS.map((item, index) => ({ label: item.label, active: index === activeIndex }))}
      onItemSelect={(_item, index) => setActiveIndex(index)}
    />
  );
}

export const ButtonItems: Story = {
  name: "Button items (no href)",
  render: () => <NavbarWithButtonItems />,
};
