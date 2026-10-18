import type { Meta, StoryObj } from "@storybook/react";
import { Button, ContextMenu, DropdownMenu } from "@fujiui/react";
import { Copy, Download, ExternalLink, FileText, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";

/**
 * ContextMenu displays a floating action menu positioned at the pointer on right-click or long-press.
 *
 * ### Discoverability & Accessibility
 * Context menus are secondary enhancement affordances. Because they are hidden until invoked,
 * users on touch screens, keyboard-only setups, or using assistive technologies may not easily
 * discover or trigger right-click and long-press interactions.
 *
 * **Always provide clearly visible fallback controls** (such as an adjacent actions button or dropdown menu)
 * exposing the same actions so every user can complete their tasks regardless of input method.
 */
const meta = {
  title: "Overlays/ContextMenu",
  component: ContextMenu,
  parameters: {
    docs: {
      description: {
        component:
          "Context menus open at the pointer on right-click or long-press. Base UI manages positioning, focus, and state. Always provide visible action fallbacks for touch, keyboard, and screen-reader accessibility.",
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3 p-6">
      <p className="text-sm text-fuji-foreground-muted">
        Right-click or long-press the file card to open the context menu. A visible actions button is also
        provided for discoverability and keyboard/touch accessibility.
      </p>

      <div className="flex items-center justify-between gap-3 rounded-fuji-panel border border-fuji-border bg-fuji-surface-subtle p-3 transition-colors hover:border-fuji-border-strong">
        <ContextMenu>
          <ContextMenu.Trigger
            tabIndex={0}
            className="flex flex-1 items-center gap-3 rounded-fuji-item select-none outline-none focus-visible:ring-2 focus-visible:ring-fuji-focus-ring"
          >
            {/* Simple file icon without any tinted tile or background */}
            <FileText className="size-5 shrink-0 text-fuji-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fuji-foreground">q3-financial-summary.pdf</p>
              <p className="text-xs text-fuji-foreground-muted">2.4 MB • Updated 2 hours ago</p>
            </div>
          </ContextMenu.Trigger>

          <ContextMenu.Content>
            <ContextMenu.Item>
              <ExternalLink className="size-4" />
              Open
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Download className="size-4" />
              Download
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Copy className="size-4" />
              Copy link
            </ContextMenu.Item>
            <ContextMenu.Item>
              <Pencil className="size-4" />
              Rename
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item className="text-fuji-fire">
              <Trash2 className="size-4" />
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>

        {/* Visible actions fallback for touch, keyboard, and screen-reader accessibility */}
        <DropdownMenu>
          <DropdownMenu.Trigger
            render={
              <Button appearance="ghost" size="sm" aria-label="More actions for q3-financial-summary.pdf">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item>
              <ExternalLink className="size-4" />
              Open
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Download className="size-4" />
              Download
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Copy className="size-4" />
              Copy link
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <Pencil className="size-4" />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item className="text-fuji-fire">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3 p-6">
      <p className="text-sm text-fuji-foreground-muted">
        Context menus support groups with headings (`ContextMenu.Group` and `ContextMenu.GroupLabel`) and
        separators.
      </p>

      <div className="flex items-center justify-between gap-3 rounded-fuji-panel border border-fuji-border bg-fuji-surface-subtle p-3 hover:border-fuji-border-strong">
        <ContextMenu>
          <ContextMenu.Trigger
            tabIndex={0}
            className="flex flex-1 items-center gap-3 rounded-fuji-item select-none outline-none focus-visible:ring-2 focus-visible:ring-fuji-focus-ring"
          >
            <FileText className="size-5 shrink-0 text-fuji-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fuji-foreground">design-tokens.json</p>
              <p className="text-xs text-fuji-foreground-muted">14 KB • JSON</p>
            </div>
          </ContextMenu.Trigger>

          <ContextMenu.Content>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>File actions</ContextMenu.GroupLabel>
              <ContextMenu.Item>
                <ExternalLink className="size-4" />
                Open
              </ContextMenu.Item>
              <ContextMenu.Item>
                <Download className="size-4" />
                Download
              </ContextMenu.Item>
              <ContextMenu.Item>
                <Share2 className="size-4" />
                Share
              </ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator />
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Manage</ContextMenu.GroupLabel>
              <ContextMenu.Item>
                <Pencil className="size-4" />
                Rename
              </ContextMenu.Item>
              <ContextMenu.Item disabled>
                <Copy className="size-4" />
                Duplicate (locked)
              </ContextMenu.Item>
              <ContextMenu.Item className="text-fuji-fire">
                <Trash2 className="size-4" />
                Delete
              </ContextMenu.Item>
            </ContextMenu.Group>
          </ContextMenu.Content>
        </ContextMenu>

        <DropdownMenu>
          <DropdownMenu.Trigger
            render={
              <Button appearance="ghost" size="sm" aria-label="More actions for design-tokens.json">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenu.Content align="end">
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>File actions</DropdownMenu.GroupLabel>
              <DropdownMenu.Item>Open</DropdownMenu.Item>
              <DropdownMenu.Item>Download</DropdownMenu.Item>
              <DropdownMenu.Item>Share</DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>Manage</DropdownMenu.GroupLabel>
              <DropdownMenu.Item>Rename</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Duplicate (locked)</DropdownMenu.Item>
              <DropdownMenu.Item className="text-fuji-fire">Delete</DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </div>
  ),
};
