import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "@fujiui/react";

const meta = {
  title: "Foundation/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = Array.from({ length: 8 }, (_, i) => (
  <p key={i} className="mb-3 text-[length:var(--fuji-text-sm)] text-fuji-foreground">
    Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
  </p>
));

export const Default: Story = {
  render: (args) => (
    <ScrollArea {...args} className="h-56 w-full max-w-sm rounded-fuji-panel border border-fuji-border p-4">
      {paragraphs}
    </ScrollArea>
  ),
};

const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

export const ListContent: Story = {
  name: "Long list",
  render: (args) => (
    <ScrollArea {...args} className="h-64 w-full max-w-xs rounded-fuji-panel border border-fuji-border">
      <ul className="m-0 flex list-none flex-col gap-1 p-3">
        {items.map((item) => (
          <li
            key={item}
            className="rounded px-2 py-1.5 text-[length:var(--fuji-text-sm)] text-fuji-foreground hover:bg-fuji-surface-strong"
          >
            {item}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};
