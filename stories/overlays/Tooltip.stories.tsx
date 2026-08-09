import type { Meta, StoryObj } from "@storybook/react";
import { Button, IconButton, Tooltip } from "@fuji-ui/react";
import { Info } from "lucide-react";

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <Tooltip.Trigger render={<Button appearance="bordered">Hover me</Button>} />
      <Tooltip.Content>Saved 2 minutes ago</Tooltip.Content>
    </Tooltip>
  ),
};

export const OnIconButton: Story = {
  render: () => (
    <Tooltip>
      <Tooltip.Trigger
        render={<IconButton aria-label="More info">{<Info className="size-4" />}</IconButton>}
      />
      <Tooltip.Content>Additional details about this field</Tooltip.Content>
    </Tooltip>
  ),
};
