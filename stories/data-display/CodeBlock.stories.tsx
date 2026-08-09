import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "@fuji-ui/react";

const SNIPPET = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;

const meta = {
  title: "Data Display/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  args: {
    code: SNIPPET,
    language: "typescript",
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-xl">
      <CodeBlock {...args} />
    </div>
  ),
};

export const NotCopyable: Story = {
  name: "Without copy button",
  args: { copyable: false },
  render: (args) => (
    <div className="w-full max-w-xl">
      <CodeBlock {...args} />
    </div>
  ),
};

export const Collapsible: Story = {
  args: { collapsible: true },
  render: (args) => (
    <div className="w-full max-w-xl">
      <CodeBlock {...args} />
    </div>
  ),
};

export const CollapsibleOpenByDefault: Story = {
  name: "Collapsible, open by default",
  args: { collapsible: true, defaultOpen: true },
  render: (args) => (
    <div className="w-full max-w-xl">
      <CodeBlock {...args} />
    </div>
  ),
};
