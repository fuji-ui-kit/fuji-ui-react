import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button, Drawer } from "@fuji-ui/react";

const meta = {
  title: "Overlays/Drawer",
  component: Drawer,
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerExample({ side }: { side: "left" | "right" | "top" | "bottom" }) {
  return (
    <Drawer>
      <Drawer.Trigger render={<Button>Open {side} drawer</Button>} />
      <Drawer.Content side={side}>
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
  name: "Bottom (mobile sheet)",
  render: () => <DrawerExample side="bottom" />,
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
