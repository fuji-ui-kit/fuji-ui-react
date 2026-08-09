import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "@fujiui/react";

const meta = {
  title: "Foundation/Stack",
  component: Stack,
  tags: ["autodocs"],
  args: {
    gap: 4,
    align: "stretch",
  },
  argTypes: {
    gap: { control: "select", options: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-fuji-control bg-fuji-surface-strong px-4 py-2 text-[length:var(--fuji-text-sm)] text-fuji-foreground">
      {label}
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <Stack {...args} className="w-full max-w-xs">
      <Placeholder label="First item" />
      <Placeholder label="Second item" />
      <Placeholder label="Third item" />
    </Stack>
  ),
};

export const GapSizes: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-row gap-8">
      {([1, 4, 8] as const).map((gap) => (
        <Stack key={gap} gap={gap} className="w-full max-w-32">
          <Placeholder label={`gap=${gap}`} />
          <Placeholder label="Item" />
          <Placeholder label="Item" />
        </Stack>
      ))}
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <Stack gap={4} align="center" className="w-full max-w-xs">
      <Placeholder label="Centered item" />
      <Placeholder label="Another centered item" />
    </Stack>
  ),
};

export const Horizontal: Story = {
  name: "Horizontal (className override)",
  render: (args) => (
    <Stack {...args} className="w-full max-w-md flex-row items-center">
      <Placeholder label="First item" />
      <Placeholder label="Second item" />
      <Placeholder label="Third item" />
    </Stack>
  ),
};
