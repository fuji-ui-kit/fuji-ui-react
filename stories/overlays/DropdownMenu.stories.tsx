import type { Meta, StoryObj } from "@storybook/react";
import { Button, DropdownMenu } from "@fuji-ui/react";
import { LogOut, Settings, User } from "lucide-react";

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button appearance="bordered">Account</Button>} />
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>My account</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>
            <User className="size-4" />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <Settings className="size-4" />
            Settings
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
          <LogOut className="size-4" />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};
