import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button, Popover } from "@fujiui/react";

const meta = {
  title: "Overlays/Popover",
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger render={<Button appearance="bordered">Share</Button>} />
      <Popover.Content>
        <Popover.Title>Share this page</Popover.Title>
        <Popover.Description>Anyone with the link can view this document.</Popover.Description>
      </Popover.Content>
    </Popover>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger render={<Button appearance="bordered">Options</Button>} />
      <Popover.Content showArrow={false}>
        <Popover.Description>No arrow, just the panel.</Popover.Description>
      </Popover.Content>
    </Popover>
  ),
};

export const OpensOnClick: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger render={<Button appearance="bordered">Share</Button>} />
      <Popover.Content>
        <Popover.Title>Share this page</Popover.Title>
      </Popover.Content>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Share" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

/** `side`, `align`, `sideOffset` and `alignOffset` are forwarded to Base UI's Positioner. */
export const Placement: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-24">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <Popover.Trigger render={<Button appearance="bordered">{side}, align end</Button>} />
          <Popover.Content side={side} align="end" alignOffset={4}>
            <Popover.Description>Opens on the {side} side, end-aligned.</Popover.Description>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
};
