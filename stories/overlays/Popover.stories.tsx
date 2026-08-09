import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button, Popover } from "@fuji-ui/react";

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
        <p className="text-[length:var(--fuji-text-sm)]">No arrow, just the panel.</p>
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
