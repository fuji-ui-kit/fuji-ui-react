import type { Meta, StoryObj } from "@storybook/react";
import { AlertDialog, Button } from "@fujiui/react";

const meta = {
  title: "Overlays/AlertDialog",
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Trigger render={<Button tone="fire">Delete project</Button>} />
      <AlertDialog.Content>
        <AlertDialog.Title>Delete project</AlertDialog.Title>
        <AlertDialog.Description>
          This will permanently delete the project and all of its data. This action cannot be undone.
        </AlertDialog.Description>
        <AlertDialog.Footer>
          <AlertDialog.Close render={<Button appearance="ghost">Cancel</Button>} />
          <AlertDialog.Close render={<Button tone="fire">Delete</Button>} />
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
