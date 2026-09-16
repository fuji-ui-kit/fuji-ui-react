import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button, Dialog } from "@fujiui/react";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button>Open dialog</Button>} />
      <Dialog.Content>
        <Dialog.Title>Delete project</Dialog.Title>
        <Dialog.Description>This action cannot be undone.</Dialog.Description>
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button appearance="ghost">Cancel</Button>} />
          <Button tone="fire">Delete</Button>
        </div>
      </Dialog.Content>
    </Dialog>
  ),
};

export const OpensOnClick: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button>Open dialog</Button>} />
      <Dialog.Content>
        <Dialog.Title>Delete project</Dialog.Title>
      </Dialog.Content>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);
    await expect(trigger).toBeInTheDocument();
  },
};

/** Content taller than the viewport scrolls inside the dialog, which caps at 85vh. */
export const LongContent: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button>Open long dialog</Button>} />
      <Dialog.Content>
        <Dialog.Title>Terms of service</Dialog.Title>
        {Array.from({ length: 40 }, (_, index) => (
          <p key={index} className="m-0">
            Clause {index + 1}. The popup caps at the viewport and scrolls its own content.
          </p>
        ))}
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button>Accept</Button>} />
        </div>
      </Dialog.Content>
    </Dialog>
  ),
};
