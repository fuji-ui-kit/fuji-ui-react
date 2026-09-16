import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tree } from "@fujiui/react";
import { File } from "lucide-react";

const DATA = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button.tsx", label: "Button.tsx", icon: <File className="size-4" /> },
          { id: "dialog.tsx", label: "Dialog.tsx", icon: <File className="size-4" /> },
        ],
      },
      { id: "index.ts", label: "index.ts", icon: <File className="size-4" /> },
    ],
  },
  {
    id: "package.json",
    label: "package.json",
    icon: <File className="size-4" />,
  },
];

const meta = {
  title: "Navigation/Tree",
  component: Tree,
  tags: ["autodocs"],
  args: {
    data: DATA,
    defaultExpandedIds: ["src", "components"],
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <Tree {...args} />
    </div>
  ),
};

export const Collapsed: Story = {
  args: { defaultExpandedIds: [] },
  render: (args) => (
    <div className="w-full max-w-sm">
      <Tree {...args} />
    </div>
  ),
};

export const SelectWithoutToggling: Story = {
  name: "Select folders without toggling (expandOnSelect={false})",
  render: function Render(args) {
    const [selectedId, setSelectedId] = React.useState<string | undefined>("src");
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Tree
          {...args}
          expandOnSelect={false}
          selectedId={selectedId}
          onSelect={(node) => setSelectedId(node.id)}
        />
        <p className="m-0 text-[length:var(--fuji-text-xs)] text-fuji-foreground-muted">
          Row click and Enter/Space select; the chevron and ArrowRight/ArrowLeft expand and collapse.
          Selected: {selectedId}
        </p>
      </div>
    );
  },
};
