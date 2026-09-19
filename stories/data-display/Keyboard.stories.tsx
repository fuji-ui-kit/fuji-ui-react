import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Card, CardContent, Input, Kbd, Keyboard, SegmentedControl, Typography } from "@fujiui/react";
import type { KeyboardKeyDef } from "@fujiui/react";

const meta = {
  title: "Data Display/Keyboard",
  component: Keyboard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    layout: { control: "select", options: ["full", "tkl", "compact", "numpad", "phone"] },
    anchor: { control: "inline-radio", options: ["viewport", "parent"] },
    placement: { control: "inline-radio", options: ["bottom", "top", "center"] },
    width: { control: "text" },
    accentKeys: { control: "object" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "select", options: ["default", "forest", "sun", "fire", "water"] },
  },
} satisfies Meta<typeof Keyboard>;

/**
 * Wires a board to a real field like an app would: characters land at the caret, and editing and
 * navigation caps (which report a `code` and no `value`) act around it.
 */
function useTypedField(initial = "") {
  const field = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState(initial);
  const caret = React.useRef<number | null>(null);

  // A controlled value rewrite parks the caret at the end; a layout effect restores it before
  // paint. `requestAnimationFrame` loses the race with React and never runs in background tabs.
  React.useLayoutEffect(() => {
    if (caret.current === null) return;
    field.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [value]);

  const onKeyPress = (key: KeyboardKeyDef) => {
    const input = field.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    const put = (next: string, at: number) => {
      caret.current = at;
      setValue(next);
    };

    if (key.value !== undefined) {
      put(value.slice(0, start) + key.value + value.slice(end), start + key.value.length);
      return;
    }
    switch (key.code) {
      case "Backspace": {
        if (start !== end) return put(value.slice(0, start) + value.slice(end), start);
        return put(value.slice(0, Math.max(0, start - 1)) + value.slice(start), Math.max(0, start - 1));
      }
      case "Delete":
        return put(value.slice(0, start) + value.slice(end + (start === end ? 1 : 0)), start);
      case "ArrowLeft":
        return input.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
      case "ArrowRight":
        return input.setSelectionRange(Math.min(value.length, end + 1), Math.min(value.length, end + 1));
      case "Home":
      case "ArrowUp":
        return input.setSelectionRange(0, 0);
      case "End":
      case "ArrowDown":
        return input.setSelectionRange(value.length, value.length);
      default:
        return;
    }
  };

  return { field, value, setValue, onKeyPress };
}

export default meta;
type Story = StoryObj<typeof meta>;

/** A 100% board: function row, main block, nav cluster and numpad. Click any cap. */
export const Default: Story = {};

export const Layouts: Story = {
  name: "Layouts",
  render: () => (
    <div className="flex flex-col gap-8">
      {(
        [
          ["full", "100% - the whole board, numpad included"],
          ["tkl", "75% - function row, no numpad"],
          ["compact", "65% - arrows tucked under the right shift"],
          ["numpad", "Number pad on its own"],
          ["phone", "Ten columns - the width a phone-docked board needs to clear the 24x24 tap-target floor"],
        ] as const
      ).map(([layout, caption]) => (
        <div key={layout} className="flex flex-col gap-2">
          <Typography scale="caption" className="text-fuji-foreground-muted">
            {caption}
          </Typography>
          <Keyboard layout={layout} size="sm" />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Keyboard key={size} layout="numpad" size={size} label={`Number pad, ${size}`} />
      ))}
    </div>
  ),
};

/** No cap is coloured until `accentKeys` names one - here the reference look: Esc and arrows. */
export const Tones: Story = {
  name: "Accent keys",
  render: () => (
    <div className="flex flex-col gap-6">
      {(["fire", "water", "forest", "sun", "default"] as const).map((tone) => (
        <Keyboard
          key={tone}
          layout="compact"
          size="sm"
          tone={tone}
          accentKeys={["Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]}
          label={`Compact board, ${tone}`}
        />
      ))}
    </div>
  ),
};

/** `accentKeys` naming a shortcut's caps turns the board into a diagram of the binding. */
export const Shortcut: Story = {
  name: "Highlighting a shortcut",
  render: () => (
    <div className="flex flex-col gap-4">
      <Typography scale="body" className="text-fuji-foreground-muted">
        Press <Kbd size="md">⌘</Kbd> <Kbd size="md">Shift</Kbd> <Kbd size="md">P</Kbd> to open the command
        palette.
      </Typography>
      <Keyboard layout="tkl" accentKeys={["MetaLeft", "ShiftLeft", "KeyP"]} />
    </div>
  ),
};

/** Every cap is a button; the board is one tab stop, and arrows/Home/End move between caps. */
export const Interactive: Story = {
  name: "Driving an input",
  render: function InteractiveBoard() {
    const { field, value, setValue, onKeyPress } = useTypedField("hello");
    return (
      <div className="flex flex-col gap-4">
        <Input
          ref={field}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Typed so far"
        />
        <Keyboard layout="compact" onKeyPress={onKeyPress} />
      </div>
    );
  },
};

/** `interactive={false}` renders plain `<kbd>` caps: a diagram, not a control. */
export const Static: Story = {
  name: "Static diagram",
  args: { layout: "compact", interactive: false },
};

/** `captureKeys` lights each cap as the real keyboard is used. Click the canvas first. */
export const CaptureKeys: Story = {
  name: "Mirroring the real keyboard",
  render: () => (
    <div className="flex flex-col gap-4">
      <Typography scale="caption" className="text-fuji-foreground-muted">
        Type anywhere on this page - the caps light as you press them.
      </Typography>
      <Keyboard layout="tkl" captureKeys />
    </div>
  ),
};

export const Disabled: Story = {
  args: { layout: "compact", disabled: true },
};

/** The board sizes its caps from the space it is given, so it fits a narrow column. */
export const InACard: Story = {
  name: "Inside a narrow container",
  render: () => (
    <div className="max-w-md">
      <Card>
        <CardContent>
          <Keyboard layout="full" />
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * `floating` docks the board over its `anchor`, centred, unmounting while closed. Clicking a cap
 * never blurs the field being typed into, and the side margins stay click-through.
 */
export const FloatingFromAnInput: Story = {
  name: "Floating - opened by an input",
  parameters: { layout: "fullscreen" },
  render: function FloatingBoard() {
    const { field, value, setValue, onKeyPress } = useTypedField();
    const [open, setOpen] = React.useState(false);
    return (
      <div className="flex min-h-[70vh] flex-col gap-4 p-8">
        <Typography scale="caption" className="text-fuji-foreground-muted">
          Focus the field to raise the keyboard. Shift and Caps Lock latch and light a lamp, the arrows move
          the caret, every cap clicks, and the real keyboard drives the same board - hold Shift on it and the
          on-screen cap lights with it. Escape, or a press anywhere outside, puts it away.
        </Typography>
        <Input
          ref={field}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tap to type"
          aria-label="Message"
        />
        <Keyboard
          floating
          open={open}
          onOpenChange={setOpen}
          triggerRef={field}
          anchor="viewport"
          layout="compact"
          captureKeys
          sound
          onKeyPress={onKeyPress}
        />
      </div>
    );
  },
};

/**
 * `layout="phone"` makes a phone-width dock work: `compact`'s 16 columns give 16.7px caps at
 * 375px, under the WCAG 2.5.8 24x24 floor; `phone`'s ten clear it. Resize the canvas to compare.
 */
export const FloatingPhone: Story = {
  name: "Floating - phone layout",
  parameters: { layout: "fullscreen" },
  render: function FloatingPhoneBoard() {
    const { field, value, setValue, onKeyPress } = useTypedField();
    const [open, setOpen] = React.useState(false);
    return (
      <div className="flex min-h-[70vh] flex-col gap-4 p-4">
        <Typography scale="caption" className="text-fuji-foreground-muted">
          Narrow the viewport to phone width - `compact` renders caps too small to meet the 24x24 tap-target
          floor there; `phone` stays above it.
        </Typography>
        <Input
          ref={field}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tap to type"
          aria-label="Message"
        />
        <Keyboard
          floating
          open={open}
          onOpenChange={setOpen}
          triggerRef={field}
          anchor="viewport"
          layout="phone"
          onKeyPress={onKeyPress}
        />
      </div>
    );
  },
};

/**
 * `anchor="parent"` docks against the nearest positioned ancestor instead of the viewport - a keypad
 * filling its own card. The parent needs `position: relative`.
 */
export const FloatingInAParent: Story = {
  name: "Floating - filling its parent",
  render: function ParentDock() {
    const trigger = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = React.useState(false);
    const [pin, setPin] = React.useState("");
    return (
      <div className="relative max-w-md overflow-hidden rounded-fuji-panel border border-fuji-border">
        <Card>
          <CardContent>
            <div className="flex flex-col items-start gap-4 pb-56">
              <Typography scale="title">Enter your PIN</Typography>
              <Input readOnly value={pin} aria-label="PIN" />
              <Button ref={trigger} appearance="bordered" onClick={() => setOpen((on) => !on)}>
                Keypad
              </Button>
            </div>
          </CardContent>
        </Card>
        <Keyboard
          floating
          anchor="parent"
          placement="bottom"
          open={open}
          onOpenChange={setOpen}
          triggerRef={trigger}
          layout="numpad"
          size="sm"
          sound
          onKeyPress={(key) => {
            if (key.code === "Backspace") setPin((value) => value.slice(0, -1));
            else if (key.code === "NumpadEnter") setPin("");
            else if (key.value) setPin((value) => value + key.value);
          }}
        />
      </div>
    );
  },
};

/**
 * A docked board sizes against the screen: `size` picks ~45vw/60vw/75vw, `width` takes any CSS
 * length. Only the cap unit is set; rows, legends and gaps follow, so proportions hold.
 */
export const FloatingWidths: Story = {
  name: "Floating - sizing",
  parameters: { layout: "fullscreen" },
  render: function Widths() {
    const [size, setSize] = React.useState<"sm" | "md" | "lg">("md");
    const [width, setWidth] = React.useState<string>("");
    return (
      <div className="flex min-h-[70vh] flex-col items-start gap-4 p-8">
        <SegmentedControl
          aria-label="Size"
          value={size}
          onValueChange={(next) => setSize(next as "sm" | "md" | "lg")}
          options={[
            { value: "sm", label: "sm" },
            { value: "md", label: "md (default)" },
            { value: "lg", label: "lg" },
          ]}
        />
        <Input
          value={width}
          onChange={(event) => setWidth(event.target.value)}
          placeholder="width — e.g. 900px, 40rem, 80vw"
          aria-label="Width override"
        />
        <Keyboard floating open dismissible={false} layout="compact" size={size} width={width || undefined} />
      </div>
    );
  },
};
