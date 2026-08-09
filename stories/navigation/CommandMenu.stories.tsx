import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, CommandMenu, type CommandMenuItem } from "@fujiui/react";
import { Calendar, FileText, Settings, User } from "lucide-react";

function CommandMenuDemo() {
  const [open, setOpen] = React.useState(false);

  const items: CommandMenuItem[] = [
    {
      id: "profile",
      label: "Go to profile",
      group: "Navigation",
      icon: <User className="size-4" />,
      onSelect: () => console.log("Go to profile"),
    },
    {
      id: "calendar",
      label: "Open calendar",
      group: "Navigation",
      icon: <Calendar className="size-4" />,
      onSelect: () => console.log("Open calendar"),
    },
    {
      id: "new-doc",
      label: "New document",
      group: "Actions",
      icon: <FileText className="size-4" />,
      shortcut: "⌘N",
      onSelect: () => console.log("New document"),
    },
    {
      id: "settings",
      label: "Open settings",
      group: "Actions",
      icon: <Settings className="size-4" />,
      onSelect: () => console.log("Open settings"),
    },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command menu</Button>
      <CommandMenu open={open} onOpenChange={setOpen} items={items} />
    </>
  );
}

const meta = {
  title: "Navigation/CommandMenu",
  component: CommandMenu,
  tags: ["autodocs"],
  args: { open: false, onOpenChange: () => {}, items: [] },
} satisfies Meta<typeof CommandMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CommandMenuDemo />,
};
