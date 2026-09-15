import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button, Drawer } from "@fujiui/react";

const meta = {
  title: "Overlays/Drawer",
  component: Drawer,
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerExample({
  side,
  variant,
}: {
  side: "left" | "right" | "top" | "bottom";
  variant?: "full" | "sheet";
}) {
  return (
    <Drawer>
      <Drawer.Trigger render={<Button>Open {variant === "sheet" ? "sheet" : `${side} drawer`}</Button>} />
      <Drawer.Content side={side} variant={variant}>
        <Drawer.Title>Filters</Drawer.Title>
        <Drawer.Description>Narrow results by category, price, and availability.</Drawer.Description>
      </Drawer.Content>
    </Drawer>
  );
}

export const Right: Story = {
  render: () => <DrawerExample side="right" />,
};

export const Left: Story = {
  render: () => <DrawerExample side="left" />,
};

export const Bottom: Story = {
  render: () => <DrawerExample side="bottom" />,
};

export const Top: Story = {
  render: () => <DrawerExample side="top" />,
};

export const Sheet: Story = {
  name: "Sheet variant",
  render: () => <DrawerExample side="bottom" variant="sheet" />,
  parameters: {
    docs: {
      description: {
        story:
          '`variant="sheet"` detaches the panel from the edge: inset all round, width-capped, ' +
          "rounded on every corner, with the dimmed page still visible around it. For a short, " +
          "self-contained task - a share menu, a confirmation - rather than navigation or a long form.",
      },
    },
  },
};

export const OpensOnClick: Story = {
  render: () => <DrawerExample side="right" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open right drawer" });
    await userEvent.click(trigger);
    await expect(trigger).toBeInTheDocument();
  },
};
